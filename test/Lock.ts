import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("DAF", function () {
  async function deployDAFFixture() {
    const THREE_DAYS_IN_SECS = 3 * 24 * 60 * 60;
    const ONE_ETH = hre.ethers.parseEther("1");
    const MINIMUM_TOKENS = hre.ethers.parseEther("100"); // 100 tokens required

    const [owner, otherAccount, recipient] = await hre.ethers.getSigners();

    // Deploy mock token first
    const Token = await hre.ethers.getContractFactory("MockToken");
    const token = await Token.deploy();

    // Deploy DAF
    const DAF = await hre.ethers.getContractFactory("DAF");
    const daf = await DAF.deploy(await token.getAddress());

    // Mint tokens for testing
    await token.mint(owner.address, hre.ethers.parseEther("1000"));
    await token.mint(otherAccount.address, hre.ethers.parseEther("50")); // Less than minimum required
    await token.mint(daf.target, hre.ethers.parseEther("1000")); // Mint to DAF for transfers

    // Approve DAF to spend tokens
    await token.connect(owner).approve(daf.target, hre.ethers.parseEther("1000"));
    await token.connect(otherAccount).approve(daf.target, hre.ethers.parseEther("50"));

    return { 
      daf, 
      token, 
      THREE_DAYS_IN_SECS,
      ONE_ETH,
      MINIMUM_TOKENS,
      owner, 
      otherAccount, 
      recipient 
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { daf, owner } = await loadFixture(deployDAFFixture);
      expect(await daf.owner()).to.equal(owner.address);
    });

    it("Should set the right governance token", async function () {
      const { daf, token } = await loadFixture(deployDAFFixture);
      expect(await daf.governanceToken()).to.equal(await token.getAddress());
    });

    it("Should set the right voting period", async function () {
      const { daf, THREE_DAYS_IN_SECS } = await loadFixture(deployDAFFixture);
      expect(await daf.votingPeriod()).to.equal(THREE_DAYS_IN_SECS);
    });
  });

  describe("Proposals", function () {
    describe("Validations", function () {
      it("Should revert with insufficient tokens", async function () {
        const { daf, recipient, otherAccount, ONE_ETH } = await loadFixture(deployDAFFixture);

        await expect(
          daf.connect(otherAccount).createProposal(recipient.address, ONE_ETH, "Test")
        ).to.be.revertedWith("Insufficient tokens to create proposal");
      });

      it("Should revert if voting on non-existent proposal", async function () {
        const { daf } = await loadFixture(deployDAFFixture);

        await expect(daf.vote(1, true)).to.be.revertedWith(
          "Proposal does not exist"
        );
      });
    });

    describe("Events", function () {
      it("Should emit an event on proposal creation", async function () {
        const { daf, ONE_ETH, recipient } = await loadFixture(deployDAFFixture);

        await expect(daf.createProposal(recipient.address, ONE_ETH, "Test"))
          .to.emit(daf, "ProposalCreated")
          .withArgs(1, recipient.address, ONE_ETH, "Test");
      });

      it("Should emit an event on vote", async function () {
        const { daf, ONE_ETH, recipient, owner } = await loadFixture(deployDAFFixture);

        await daf.createProposal(recipient.address, ONE_ETH, "Test");
        await expect(daf.vote(1, true))
          .to.emit(daf, "Voted")
          .withArgs(1, owner.address, true, anyValue);
      });
    });

    describe("Execution", function () {
      it("Should execute successful proposal", async function () {
        const { daf, token, ONE_ETH, recipient } = await loadFixture(deployDAFFixture);

        // Create and vote on proposal
        await daf.createProposal(recipient.address, ONE_ETH, "Test");
        await daf.vote(1, true);

        // Transfer tokens to DAF for execution
        await token.transfer(daf.target, ONE_ETH);

        // Increase time past voting period
        await time.increase(3 * 24 * 60 * 60 + 1);

        await expect(daf.executeProposal(1))
          .to.emit(daf, "ProposalExecuted")
          .withArgs(1);
      });

      it("Should not execute if voting period not ended", async function () {
        const { daf, ONE_ETH, recipient } = await loadFixture(deployDAFFixture);

        await daf.createProposal(recipient.address, ONE_ETH, "Test");
        await daf.vote(1, true);

        await expect(daf.executeProposal(1))
          .to.be.revertedWith("Voting period not ended");
      });

      it("Should not execute failed proposals", async function () {
        const { daf, ONE_ETH, recipient } = await loadFixture(deployDAFFixture);

        await daf.createProposal(recipient.address, ONE_ETH, "Test");
        await daf.vote(1, false);

        await time.increase(3 * 24 * 60 * 60 + 1);

        await expect(daf.executeProposal(1))
          .to.be.revertedWith("Proposal did not pass");
      });
    });
  });
});