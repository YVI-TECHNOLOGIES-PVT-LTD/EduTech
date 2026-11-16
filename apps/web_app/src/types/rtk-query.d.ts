export type TagItem = string | { type: string; id?: string | number };

export interface ApiBuilder {
  query: <TResult, TArg = void>(options: {
    query: (
      arg: TArg,
    ) => string | { url: string; method?: string; body?: any; params?: any; headers?: any };
    providesTags?:
      | readonly TagItem[]
      | TagItem[]
      | ((result: TResult | undefined, error: any, arg: TArg) => readonly TagItem[] | TagItem[]);
  }) => any;
  mutation: <TResult, TArg = void>(options: {
    query: (
      arg: TArg,
    ) => string | { url: string; method?: string; body?: any; params?: any; headers?: any };
    invalidatesTags?:
      | readonly TagItem[]
      | TagItem[]
      | ((result: TResult | undefined, error: any, arg: TArg) => readonly TagItem[] | TagItem[]);
  }) => any;
}
