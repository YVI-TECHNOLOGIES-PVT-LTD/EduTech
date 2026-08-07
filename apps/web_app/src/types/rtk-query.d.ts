export interface ApiBuilder {
  query: <TResult, TArg = void>(options: {
    query: (
      arg: TArg,
    ) => string | { url: string; method?: string; body?: any; params?: any; headers?: any };
    providesTags?: string[] | ((result: TResult | undefined, error: any, arg: TArg) => string[]);
  }) => any;
  mutation: <TResult, TArg = void>(options: {
    query: (
      arg: TArg,
    ) => string | { url: string; method?: string; body?: any; params?: any; headers?: any };
    invalidatesTags?: string[] | ((result: TResult | undefined, error: any, arg: TArg) => string[]);
  }) => any;
}
