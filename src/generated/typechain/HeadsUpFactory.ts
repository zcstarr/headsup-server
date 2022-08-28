/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import type BN from "bn.js";
import type { ContractOptions } from "web3-eth-contract";
import type { EventLog } from "web3-core";
import type { EventEmitter } from "events";
import type {
  Callback,
  PayableTransactionObject,
  NonPayableTransactionObject,
  BlockType,
  ContractEventLog,
  BaseContract,
} from "./types";

export interface EventOptions {
  filter?: object;
  fromBlock?: BlockType;
  topics?: string[];
}

export type Launch = ContractEventLog<{
  from: string;
  to: string;
  0: string;
  1: string;
}>;
export type OwnershipTransferred = ContractEventLog<{
  previousOwner: string;
  newOwner: string;
  0: string;
  1: string;
}>;

export interface HeadsUpFactory extends BaseContract {
  constructor(
    jsonInterface: any[],
    address?: string,
    options?: ContractOptions
  ): HeadsUpFactory;
  clone(): HeadsUpFactory;
  methods: {
    deployedContracts(
      arg0: number | string | BN
    ): NonPayableTransactionObject<string>;

    getNewsletters(
      addr: string,
      offset: number | string | BN,
      limit: number | string | BN
    ): NonPayableTransactionObject<{
      0: string[];
      1: string;
    }>;

    launchNftFeed(
      name: string,
      symbol: string,
      jsonUrlHash: string | number[]
    ): NonPayableTransactionObject<void>;

    owner(): NonPayableTransactionObject<string>;

    renounceOwnership(): NonPayableTransactionObject<void>;

    transferOwnership(newOwner: string): NonPayableTransactionObject<void>;

    userAddressToNewsletters(
      arg0: string,
      arg1: number | string | BN
    ): NonPayableTransactionObject<string>;
  };
  events: {
    Launch(cb?: Callback<Launch>): EventEmitter;
    Launch(options?: EventOptions, cb?: Callback<Launch>): EventEmitter;

    OwnershipTransferred(cb?: Callback<OwnershipTransferred>): EventEmitter;
    OwnershipTransferred(
      options?: EventOptions,
      cb?: Callback<OwnershipTransferred>
    ): EventEmitter;

    allEvents(options?: EventOptions, cb?: Callback<EventLog>): EventEmitter;
  };

  once(event: "Launch", cb: Callback<Launch>): void;
  once(event: "Launch", options: EventOptions, cb: Callback<Launch>): void;

  once(event: "OwnershipTransferred", cb: Callback<OwnershipTransferred>): void;
  once(
    event: "OwnershipTransferred",
    options: EventOptions,
    cb: Callback<OwnershipTransferred>
  ): void;
}
