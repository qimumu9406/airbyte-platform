import { selectFromDropdown } from "@cy/commands/common";

const startFromScratchButton = "button[data-testid='start-from-scratch']";
const nameInput = "input[name='name']";
const urlBaseInput = "input[name='formValues.global.urlBase']";
const addStreamButton = "button[data-testid='add-stream']";
const apiKeyInput = "input[name='connectionConfiguration.api_key']";
const togglePaginationInput = "input[data-testid='toggle-formValues.streams.0.paginator']";
const toggleParameterizedRequestsInput = "input[data-testid='toggle-formValues.streams.0.parameterizedRequests']";
const streamNameInput = "input[name='streamName']";
const streamUrlPathFromModal = "input[name='urlPath']";
const streamUrlPathFromForm = "input[name='formValues.streams.0.urlPath']";
const recordSelectorInput = "[data-testid='tag-input'] input";
const authType = "[data-testid='formValues.global.authenticator.type']";
const testInputsButton = "[data-testid='test-inputs']";
const limitInput = "[name='formValues.streams.0.paginator.strategy.page_size']";
const injectLimitInto = "[data-testid$='paginator.pageSizeOption.inject_into']";
const injectLimitFieldName = "[name='formValues.streams.0.paginator.pageSizeOption.field_name']";
const injectOffsetInto = "[data-testid$='paginator.pageTokenOption.inject_into']";
const injectOffsetFieldName = "[name='formValues.streams.0.paginator.pageTokenOption.field_name']";
const testPageItem = "[data-testid='test-pages'] li";
const submit = "button[type='submit']";
const testStreamButton = "button[data-testid='read-stream']";
const sliceDropdown = '[data-testid="tag-select-slice"]';

export const goToConnectorBuilderCreatePage = () => {
  cy.visit("/connector-builder/create");
};

export const goToConnectorBuilderProjectsPage = () => {
  cy.visit("/connector-builder");
};

export const editProjectBuilder = (name: string) => {
  cy.get(`button[data-testid='edit-project-button-${name}']`).click();
};

export const startFromScratch = () => {
  cy.get(startFromScratchButton).click();
};

export const enterName = (name: string) => {
  cy.get(nameInput).clear();
  cy.get(nameInput).type(name);
};

export const enterUrlBase = (urlBase: string) => {
  cy.get(urlBaseInput).type(urlBase);
};

export const enterRecordSelector = (recordSelector: string) => {
  cy.get(recordSelectorInput).first().type(recordSelector);
  cy.get(recordSelectorInput).first().type("{enter}");
};

export const selectAuthMethod = (value: string) => {
  selectFromDropdown(authType, value);
};

export const selectActiveVersion = (name: string, version: number) => {
  cy.get(`[data-testid='version-changer-${name}']`).click();
  cy.get("[data-testid='versions-list'] > button").contains(`v${version}`).click();
};

export const goToView = (view: string) => {
  cy.get(`button[data-testid=navbutton-${view}]`).click();
};

export const openTestInputs = () => {
  cy.get(testInputsButton).click();
};

export const enterTestInputs = ({ apiKey }: { apiKey: string }) => {
  cy.get(apiKeyInput).type(apiKey);
};

export const goToTestPage = (page: number) => {
  cy.get(testPageItem).contains(page).click();
};

export const enablePagination = () => {
  // force: true is needed because the input has display: none, as we don't want to show default checkboxes
  cy.get(togglePaginationInput).check({ force: true });
};

export const configureLimitOffsetPagination = (
  limit: string,
  limitInto: string,
  limitFieldName: string,
  offsetInto: string,
  offsetFieldName: string
) => {
  cy.get(limitInput).type(limit);
  selectFromDropdown(injectLimitInto, limitInto);
  cy.get(injectLimitFieldName).type(limitFieldName);
  selectFromDropdown(injectOffsetInto, offsetInto);
  cy.get(injectOffsetFieldName).type(offsetFieldName);
};

export const enableParameterizedRequests = () => {
  // force: true is needed because the input has display: none, as we don't want to show default checkboxes
  cy.get(toggleParameterizedRequestsInput).check({ force: true });
};

export const configureParameters = (values: string, cursor_field: string) => {
  cy.get('[data-testid="tag-input-formValues.streams.0.parameterizedRequests.0.values.value"] input[type="text"]').type(
    values
  );
  cy.get("[name='formValues.streams.0.parameterizedRequests.0.cursor_field']").type(cursor_field);
};

export const getSlicesFromDropdown = () => {
  cy.get(`${sliceDropdown} button`).click();
  return cy.get(`${sliceDropdown} li`);
};

export const openStreamConfigurationTab = () => {
  cy.get('[data-testid="tag-tab-stream-configuration"]').click();
};

export const openStreamSchemaTab = () => {
  cy.get('[data-testid="tag-tab-stream-schema"]').click();
};

export const openDetectedSchemaTab = () => {
  cy.get('[data-testid="tag-tab-detected-schema"]').click();
};

export const getDetectedSchemaElement = () => {
  return cy.get('pre[class*="SchemaDiffView"]');
};

export const addStream = () => {
  cy.get(addStreamButton).click();
};

export const enterStreamName = (streamName: string) => {
  cy.get(streamNameInput).type(streamName);
};

export const enterUrlPathFromForm = (urlPath: string) => {
  cy.get(streamUrlPathFromModal).type(urlPath);
};

export const getUrlPathInput = () => {
  return cy.get(streamUrlPathFromForm);
};

export const enterUrlPath = (urlPath: string) => {
  cy.get('[name="formValues.streams.0.urlPath"]').focus();
  cy.get('[name="formValues.streams.0.urlPath"]').clear();
  cy.get('[name="formValues.streams.0.urlPath"]').type(urlPath);
};

export const submitForm = () => {
  cy.get(submit).click();
};

export const testStream = () => {
  // wait for debounced form
  // eslint-disable-next-line cypress/no-unnecessary-waiting
  cy.wait(500);
  cy.get(testStreamButton).click();
};

const GO_BACK_AND_GO_NEXT_BUTTONS = 2;
export const assertHasNumberOfPages = (numberOfPages: number) => {
  for (let i = 0; i < numberOfPages; i++) {
    cy.get(testPageItem)
      .contains(i + 1)
      .should("exist");
  }

  cy.get(testPageItem).should("have.length", numberOfPages + GO_BACK_AND_GO_NEXT_BUTTONS);
};
