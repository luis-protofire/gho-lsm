import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  gql,
} from '@apollo/client/core/index';
import { ethers, BigNumberish } from 'ethers';

type RewardDistributor = {
  id: string;
  rewardTokens: string[];
  rewardNames: string[];
};

type VotingEscrow = {
  id: string;
  address: string;
  name: string;
  symbol: string;
  lockedAmount: BigNumberish;
};

export type VeSystem = {
  id: string;
  bptToken: string;
  bptTokenName: string;
  votingEscrow: VotingEscrow;
  rewardDistributor: RewardDistributor;
  rewardDistributorAddress: string;
  rewardFaucetAddress: string;
};

type RawVotingEscrow = {
  id: string;
  address: string;
  name: string;
  symbol: string;
  lockedAmount: string;
};

type RawVeSystem = {
  id: string;
  bptToken: string;
  bptTokenName: string;
  votingEscrow: RawVotingEscrow;
  rewardDistributor: RewardDistributor;
  rewardDistributorAddress: string;
  rewardFaucetAddress: string;
};

type GetVeSystemsResponse = {
  data: {
    vesystems: RawVeSystem[];
  };
};

type GetVeSystemResponse = {
  data: {
    vesystem: RawVeSystem;
  };
};

const format = (vesystem: RawVeSystem): VeSystem => ({
  ...vesystem,
  votingEscrow: {
    ...vesystem.votingEscrow,
    // TODO: lockedAmount: ethers.parseUnits(vesystem.votingEscrow.lockedAmount, vesystem.votingEscrow.decimals),
    lockedAmount: ethers.parseEther(vesystem.votingEscrow.lockedAmount),
  },
});

export class LaunchpadSubgraph {
  public client: ApolloClient<NormalizedCacheObject>;

  constructor(uri: string) {
    this.client = new ApolloClient({
      uri,
      cache: new InMemoryCache(),
    });
  }

  public async getVeSystems(): Promise<VeSystem[]> {
    const query = gql(`
      query GetVeSystems {
        vesystems {
          id
          bptToken
          bptTokenName
          votingEscrow {
            id
            address
            name
            symbol
            lockedAmount
          }
          rewardDistributorAddress
          rewardFaucetAddress
          rewardDistributor {
            id
            rewardTokens
            rewardNames
          }
        }
      }
    `);

    const {
      data: { vesystems },
    } = (await this.client.query({ query })) as GetVeSystemsResponse;

    return vesystems.map(vesystem => format(vesystem));
  }

  public async getVeSystem(id: string): Promise<VeSystem> {
    const query = gql(`
      query GetVeSystem($id: String!) {
        vesystem(id: $id) {
          id
          bptToken
          bptTokenName
          votingEscrow {
            id
            address
            name
            symbol
            lockedAmount
          }
          rewardFaucetAddress
          rewardDistributorAddress
          rewardDistributor {
            id
            rewardTokens
            rewardNames
          }
        }
      }
    `);

    const {
      data: { vesystem },
    } = (await this.client.query({
      query,
      variables: { id },
    })) as GetVeSystemResponse;

    return format(vesystem);
  }
}