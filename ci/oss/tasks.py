


import os

from aircmd.actions.environments import (
    with_global_dockerd_service,
    with_gradle,
)
from aircmd.models.base import PipelineContext
from aircmd.models.utils import load_settings
from dagger import CacheVolume, Client, Container
from prefect import task

from .settings import OssSettings

# Determine the base directory
base_dir = None if os.getcwd().endswith('oss') else "oss"

@task
async def build_oss_task(settings: OssSettings, ctx: PipelineContext, client: Client) -> Container:
    dockerd_service = with_global_dockerd_service(client, settings)

    ctx.dockerd_service = dockerd_service

    # This is the list of files needed to run. Keep this as minimal as possible to avoid accidentally invalidating the cache
    files_from_host=["airbyte-*/**/*"]
    
    # Now we execute the build inside the container. Each step is analagous to a layer in buildkit
    # Be careful what is passed in here, as anything like a timestamp will invalidate the whole cache.
    result = (with_gradle(client, ctx, settings, sources_to_include=files_from_host, directory=base_dir)
                .with_service_binding("dockerd", dockerd_service)
                .with_(load_settings(settings))
                .with_env_variable("VERSION", "dev")
                .with_workdir("/airbyte/oss" if base_dir == "oss" else "/airbyte")
                .with_exec(["./gradlew", ":airbyte-config:specs:downloadConnectorRegistry", "--rerun", "--build-cache"])
                .with_exec(["./gradlew", "assemble", "-x", "buildDockerImage", "-x", "dockerBuildImage", "publishtoMavenLocal", "--build-cache"])
        )

    return result.sync()

@task
async def test_oss_backend_task(client: Client, oss_build_result: Container, settings: OssSettings, ctx: PipelineContext) -> Container:
    npm_cache: CacheVolume = client.cache_volume("platform-node-modules")
    files_from_result = [
                            "**/build.gradle", 
                            "**/gradle.properties", 
                            "**/settings.gradle",
                            "**/airbyte-*/**/*"
                            ]
    

    client.cache_volume("platform-build-cache")

    ( # service binding for airbyte-proxy-test-container
        client.container()
        .from_("nginx:latest")
        .with_directory("/", oss_build_result.directory("airbyte-proxy"))
        .with_env_variable("BASIC_AUTH_USERNAME", settings.basic_auth_username)
        .with_env_variable("BASIC_AUTH_PASSWORD", settings.basic_auth_password)
        .with_env_variable("BASIC_AUTH_PROXY_TIMEOUT", settings.basic_auth_proxy_timeout)
        .with_env_variable("PROXY_PASS_WEB", "http://localhost")
        .with_env_variable("PROXY_PASS_API", "http://localhost")
        .with_env_variable("CONNECTOR_BUILDER_SERVER_API", "http://localhost")
        .with_exposed_port(80)
    )
        
    result = (
                with_gradle(client, ctx, settings, directory=base_dir)
                #.with_service_binding("airbyte-proxy-test-container1", airbyte_proxy_service_1)
                .with_mounted_cache("/airbyte/oss/airbyte-webapp/node_modules", npm_cache)
                .with_directory("/root/.m2/repository", oss_build_result.directory("/root/.m2/repository")) # published jar files from mavenLocal
                .with_directory("/airbyte/oss", oss_build_result.directory("/airbyte/oss"), include=files_from_result)
                .with_workdir("/airbyte/oss" if base_dir == "oss" else "/airbyte")
                .with_(load_settings(settings))
                .with_env_variable("VERSION", "dev")
                #TODO: Wire airbyte-proxy tests in with services
                #TODO: Investigate the one failing test at :airbyte-metrics:metrics-lib:test
                #TODO: build webapp in parallel with backend build in another container
                # It appears webapp needs at least one file that's generated by the java build
                .with_exec(["./gradlew", ":airbyte-webapp:build", "test", "-x", "buildDockerImage", "-x", "airbyte-proxy:bashTest", "-x", ":airbyte-metrics:metrics-lib:test", "--build-cache"]) 

        )
    return result.sync()