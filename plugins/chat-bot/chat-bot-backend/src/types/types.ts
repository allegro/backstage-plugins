export interface IDoc {
  title: string;
  text: string;
  url: string;
  metadata?: IDocMetadata;
  references?: IReference[];
}

export interface IDocMetadata {
  [key: string]: string;
}

export interface IReference {
  url: string;
  description: string;
}
