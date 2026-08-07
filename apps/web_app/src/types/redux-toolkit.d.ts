declare module '@reduxjs/toolkit/query' {
  export interface EndpointBuilder<BaseQuery, TagTypes extends string, ReducerPath extends string> {
    query<ResultType, QueryArg>(options: {
      query: (arg: QueryArg) => any;
      providesTags?: any;
    }): any;
    mutation<ResultType, QueryArg>(options: {
      query: (arg: QueryArg) => any;
      invalidatesTags?: any;
    }): any;
  }
}
