import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { GRAPHQL_ENDPOINT } from '../constants/constants';

const httpLink = createHttpLink({ uri: GRAPHQL_ENDPOINT });

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});