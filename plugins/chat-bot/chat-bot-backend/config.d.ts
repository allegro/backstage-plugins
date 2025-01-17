export interface Config {
  chatBot: {
    /**
     * Open AI key
     * @visibility secret
     */
    key: string;

    /**
     * Open AI service endpoint
     * @visibility backend
     */
    endpoint: string;
  };
}
