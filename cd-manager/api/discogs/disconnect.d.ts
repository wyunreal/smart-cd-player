declare module "disconnect" {
  export class Client {
    constructor(userAgent?: string, auth?: AuthOptions);
    database(): Database;
    oauth(): OAuth;
    user(): User;
    marketplace(): Marketplace;
    setConfig(config: ClientConfig): Client;
    getIdentity(callback?: Callback<Identity>): Promise<Identity>;
  }

  interface AuthOptions {
    userToken?: string;
    consumerKey?: string;
    consumerSecret?: string;
    accessToken?: string;
    accessTokenSecret?: string;
  }

  interface ClientConfig {
    outputFormat?: "plaintext" | "html" | "discogs";
  }

  interface Callback<T> {
    (err: Error | null, data: T, rateLimit?: RateLimit): void;
  }

  interface RateLimit {
    limit: number;
    remaining: number;
  }

  interface Identity {
    id: number;
    username: string;
    resource_url: string;
  }

  interface Database {
    search(
      params: SearchParams,
      callback?: Callback<SearchResults>,
    ): Promise<SearchResults>;
    getRelease(id: number, callback?: Callback<Release>): Promise<Release>;
    getArtist(id: number, callback?: Callback<Artist>): Promise<Artist>;
    getLabel(id: number, callback?: Callback<Label>): Promise<Label>;
    getMaster(id: number, callback?: Callback<Master>): Promise<Master>;
    getImage(url: string, callback?: Callback<Buffer>): Promise<Buffer>;
  }

  interface SearchParams {
    query?: string;
    type?: "release" | "master" | "artist" | "label";
    title?: string;
    release_title?: string;
    credit?: string;
    artist?: string;
    anv?: string;
    label?: string;
    genre?: string;
    style?: string;
    country?: string;
    year?: string | number;
    format?: string;
    catno?: string;
    barcode?: string;
    track?: string;
    submitter?: string;
    contributor?: string;
    page?: number;
    per_page?: number;
  }

  interface SearchResults {
    pagination: Pagination;
    results: SearchResult[];
  }

  interface Pagination {
    page: number;
    pages: number;
    per_page: number;
    items: number;
    urls: {
      last?: string;
      next?: string;
    };
  }

  interface SearchResult {
    id: number;
    type: string;
    title: string;
    year?: number;
    genre?: string[];
    style?: string[];
    thumb?: string;
    cover_image?: string;
    resource_url: string;
    master_id?: number;
    master_url?: string;
    uri: string;
    country?: string;
    format?: string[];
    label?: string[];
    barcode?: string[];
  }

  interface Release {
    id: number;
    title: string;
    year?: number;
    artists: Artist[];
    labels?: Label[];
    genres?: string[];
    styles?: string[];
    tracklist: Track[];
    images?: Image[];
    videos?: Video[];
    formats?: Format[];
    country?: string;
    released?: string;
    notes?: string;
    data_quality?: string;
    master_id?: number;
    master_url?: string;
    uri: string;
    resource_url: string;
  }

  interface Artist {
    id: number;
    name: string;
    anv?: string;
    join?: string;
    role?: string;
    tracks?: string;
    resource_url?: string;
    profile?: string;
    images?: Image[];
    members?: Artist[];
    urls?: string[];
  }

  interface Label {
    id: number;
    name: string;
    catno?: string;
    entity_type?: string;
    entity_type_name?: string;
    resource_url?: string;
    profile?: string;
    images?: Image[];
    urls?: string[];
  }

  interface Track {
    position: string;
    type_: string;
    title: string;
    duration?: string;
    artists?: Artist[];
    extraartists?: Artist[];
  }

  interface Image {
    type: string;
    uri: string;
    resource_url: string;
    uri150: string;
    width: number;
    height: number;
  }

  interface Video {
    uri: string;
    title: string;
    description: string;
    duration: number;
    embed: boolean;
  }

  interface Format {
    name: string;
    qty: string;
    descriptions?: string[];
    text?: string;
  }

  interface Master {
    id: number;
    title: string;
    year: number;
    artists: Artist[];
    genres?: string[];
    styles?: string[];
    tracklist: Track[];
    images?: Image[];
    videos?: Video[];
    uri: string;
    resource_url: string;
    versions_url: string;
    main_release: number;
    main_release_url: string;
  }

  interface OAuth {
    getRequestToken(
      consumerKey: string,
      consumerSecret: string,
      callbackUrl: string,
      callback?: Callback<RequestTokenData>,
    ): Promise<RequestTokenData>;
    getAccessToken(
      verifier: string,
      callback?: Callback<AccessTokenData>,
    ): Promise<AccessTokenData>;
  }

  interface RequestTokenData {
    token: string;
    tokenSecret: string;
    authorizeUrl: string;
  }

  interface AccessTokenData {
    accessToken: string;
    accessTokenSecret: string;
  }

  interface User {
    getProfile(
      username: string,
      callback?: Callback<UserProfile>,
    ): Promise<UserProfile>;
    collection(): Collection;
    wantlist(): Wantlist;
    list(): List;
  }

  interface UserProfile {
    id: number;
    username: string;
    name: string;
    email?: string;
    profile?: string;
    home_page?: string;
    location?: string;
    registered?: string;
    num_collection?: number;
    num_wantlist?: number;
    releases_contributed?: number;
    rank?: number;
    releases_rated?: number;
    rating_avg?: number;
    inventory_url?: string;
    collection_folders_url?: string;
    collection_fields_url?: string;
    wantlist_url?: string;
    uri: string;
    resource_url: string;
  }

  interface Collection {
    getReleases(
      username: string,
      folderId: number,
      params?: CollectionParams,
      callback?: Callback<CollectionResults>,
    ): Promise<CollectionResults>;
  }

  interface CollectionParams {
    page?: number;
    per_page?: number;
  }

  interface CollectionResults {
    pagination: Pagination;
    releases: CollectionRelease[];
  }

  interface CollectionRelease {
    id: number;
    instance_id: number;
    folder_id: number;
    rating: number;
    basic_information: SearchResult;
  }

  interface Wantlist {
    getReleases(
      username: string,
      params?: CollectionParams,
      callback?: Callback<WantlistResults>,
    ): Promise<WantlistResults>;
  }

  interface WantlistResults {
    pagination: Pagination;
    wants: WantlistItem[];
  }

  interface WantlistItem {
    id: number;
    rating: number;
    basic_information: SearchResult;
  }

  interface List {
    getItems(
      listId: number,
      params?: CollectionParams,
      callback?: Callback<ListResults>,
    ): Promise<ListResults>;
  }

  interface ListResults {
    pagination: Pagination;
    items: ListItem[];
  }

  interface ListItem {
    id: number;
    type: string;
    display_title: string;
    uri: string;
    resource_url: string;
    basic_information?: SearchResult;
  }

  interface Marketplace {
    search(
      params: MarketplaceSearchParams,
      callback?: Callback<MarketplaceResults>,
    ): Promise<MarketplaceResults>;
  }

  interface MarketplaceSearchParams extends SearchParams {
    release_id?: number;
    master_id?: number;
  }

  interface MarketplaceResults {
    pagination: Pagination;
    listings: MarketplaceListing[];
  }

  interface MarketplaceListing {
    id: number;
    status: string;
    price: {
      value: number;
      currency: string;
    };
    condition: string;
    sleeve_condition: string;
    ships_from: string;
    uri: string;
    resource_url: string;
    release: SearchResult;
  }
}
