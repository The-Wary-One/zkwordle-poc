import type { JSONObject } from './scalars';
import type { NonEmptyString } from './scalars';
import type { ValidGuess } from './scalars';
import type { WordHash } from './scalars';
import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = { [X in Exclude<keyof T, K>]?: T[X] } & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** See https://www.graphql-scalars.dev/docs/scalars/json-object */
  JSONObject: JSONObject;
  /** See https://www.graphql-scalars.dev/docs/scalars/non-empty-string */
  NonEmptyString: NonEmptyString;
  /** A valid lowercase word of the right length */
  ValidGuess: ValidGuess;
  /** A hash corresponding to a word */
  WordHash: WordHash;
};

export type GuessInput = {
  readonly guess: Scalars['ValidGuess'];
};

export type GuessZkPayload = {
  readonly __typename?: 'GuessZKPayload';
  /** The hints */
  readonly hints: ReadonlyArray<Hint>;
  /** The generated zk proof to verify */
  readonly proof: Scalars['JSONObject'];
  /**
   * The content of the public.json file required to verify the proof.
   * It is composed by the hint, the guess and the wordHash.
   */
  readonly publicSignals: ReadonlyArray<Scalars['NonEmptyString']>;
};

/** A letter hint */
export enum Hint {
  /** The letter isn't in the word */
  Absent = 0,
  /** The letter is in the wrong position */
  BadPosition = 1,
  /** The letter is in the right position */
  GoodPosition = 2
}

export type Query = {
  readonly __typename?: 'Query';
  readonly guess: GuessZkPayload;
  readonly solutionHash: Scalars['WordHash'];
  readonly validGuesses: ReadonlyArray<Scalars['ValidGuess']>;
};


export type QueryGuessArgs = {
  input: GuessInput;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  GuessInput: GuessInput;
  GuessZKPayload: ResolverTypeWrapper<GuessZkPayload>;
  Hint: Hint;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  JSONObject: ResolverTypeWrapper<Scalars['JSONObject']>;
  NonEmptyString: ResolverTypeWrapper<Scalars['NonEmptyString']>;
  Query: ResolverTypeWrapper<{}>;
  String: ResolverTypeWrapper<Scalars['String']>;
  ValidGuess: ResolverTypeWrapper<Scalars['ValidGuess']>;
  WordHash: ResolverTypeWrapper<Scalars['WordHash']>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean'];
  GuessInput: GuessInput;
  GuessZKPayload: GuessZkPayload;
  Int: Scalars['Int'];
  JSONObject: Scalars['JSONObject'];
  NonEmptyString: Scalars['NonEmptyString'];
  Query: {};
  String: Scalars['String'];
  ValidGuess: Scalars['ValidGuess'];
  WordHash: Scalars['WordHash'];
};

export type RateLimitDirectiveArgs = {
  arrayLengthField?: Maybe<Scalars['String']>;
  identityArgs?: Maybe<ReadonlyArray<Maybe<Scalars['String']>>>;
  max?: Maybe<Scalars['Int']>;
  message?: Maybe<Scalars['String']>;
  window?: Maybe<Scalars['String']>;
};

export type RateLimitDirectiveResolver<Result, Parent, ContextType = any, Args = RateLimitDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type GuessZkPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['GuessZKPayload'] = ResolversParentTypes['GuessZKPayload']> = {
  hints?: Resolver<ReadonlyArray<ResolversTypes['Hint']>, ParentType, ContextType>;
  proof?: Resolver<ResolversTypes['JSONObject'], ParentType, ContextType>;
  publicSignals?: Resolver<ReadonlyArray<ResolversTypes['NonEmptyString']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonObjectScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSONObject'], any> {
  name: 'JSONObject';
}

export interface NonEmptyStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['NonEmptyString'], any> {
  name: 'NonEmptyString';
}

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  guess?: Resolver<ResolversTypes['GuessZKPayload'], ParentType, ContextType, RequireFields<QueryGuessArgs, 'input'>>;
  solutionHash?: Resolver<ResolversTypes['WordHash'], ParentType, ContextType>;
  validGuesses?: Resolver<ReadonlyArray<ResolversTypes['ValidGuess']>, ParentType, ContextType>;
};

export interface ValidGuessScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['ValidGuess'], any> {
  name: 'ValidGuess';
}

export interface WordHashScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['WordHash'], any> {
  name: 'WordHash';
}

export type Resolvers<ContextType = any> = {
  GuessZKPayload?: GuessZkPayloadResolvers<ContextType>;
  JSONObject?: GraphQLScalarType;
  NonEmptyString?: GraphQLScalarType;
  Query?: QueryResolvers<ContextType>;
  ValidGuess?: GraphQLScalarType;
  WordHash?: GraphQLScalarType;
};

export type DirectiveResolvers<ContextType = any> = {
  rateLimit?: RateLimitDirectiveResolver<any, any, ContextType>;
};
