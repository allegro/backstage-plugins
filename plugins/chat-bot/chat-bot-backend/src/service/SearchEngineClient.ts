import { AuthService, DiscoveryService } from '@backstage/backend-plugin-api';

export interface SearchEngineResponse {
  results: SearchEngineQueryResult[];
}

export interface SearchEngineQueryResult {
  document: SearchEngineDocument;
}

export interface SearchEngineDocument {
  text: string;
  location: string;
  entityTitle: string;
}

export class SearchEngineClient {
  private readonly pluginId: string = 'search';
  private readonly discovery: DiscoveryService;
  private readonly auth: AuthService;

  constructor(discovery: DiscoveryService, auth: AuthService) {
    this.discovery = discovery;
    this.auth = auth;
  }

  private getUrl = async () => await this.discovery.getBaseUrl(this.pluginId);

  private getToken = async () =>
    await this.auth.getPluginRequestToken({
      onBehalfOf: await this.auth.getOwnServiceCredentials(),
      targetPluginId: this.pluginId,
    });

  query = async (
    term: string,
    type?: null | 'software-catalog' | 'techdocs' | 'adr' | `qeta`,
  ): Promise<SearchEngineResponse> => {
    const baseUrl = await this.getUrl();
    const token = await this.getToken();

    const url = new URL(`${baseUrl}/query`);
    url.searchParams.append('term', term);
    url.searchParams.append('pageCursor', '0');
    url.searchParams.append('pageLimit', '2');

    if (type) {
      url.searchParams.append('types[0]', type);
    }

    const headers: HeadersInit = new Headers();
    headers.set('authorization', `Bearer ${token.token}`);

    const request = new Request(url, {
      headers,
    });

    const response = await fetch(request);

    if (response.ok) {
      return (await response.json()) as SearchEngineResponse;
    }
    return { results: [] };
  };
}
