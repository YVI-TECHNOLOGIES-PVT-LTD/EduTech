export interface KeyValuePair<T = any> {
  readonly key: string;
  readonly value: T;
}

export interface OptionDto<T = string> {
  readonly label: string;
  readonly value: T;
  readonly disabled?: boolean;
}

export interface IdentificationDto {
  readonly id: string;
  readonly code?: string;
  readonly name?: string;
}
