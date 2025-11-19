"use client";

import { ethers } from "ethers";
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { FhevmInstance } from "@/fhevm/fhevmTypes";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { GenericStringStorage } from "@/fhevm/GenericStringStorage";

import { PayrollDappAddresses } from "@/abi/PayrollDappAddresses";
import { PayrollDappABI } from "@/abi/PayrollDappABI";

export type ClearValueType = {
  handle: string;
  clear: string | bigint | boolean;
};

type PayrollDappInfoType = {
  abi: typeof PayrollDappABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
};

function getPayrollDappByChainId(
  chainId: number | undefined
): PayrollDappInfoType {
  if (!chainId) {
    return { abi: PayrollDappABI.abi };
  }

  const entry =
    PayrollDappAddresses[chainId.toString() as keyof typeof PayrollDappAddresses];

  if (!entry || !("address" in entry) || entry.address === ethers.ZeroAddress) {
    return { abi: PayrollDappABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: PayrollDappABI.abi,
  };
}

export const usePayrollDapp = (parameters: {
  instance: FhevmInstance | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: ethers.Eip1193Provider | undefined;
  chainId: number | undefined;
  ethersSigner: ethers.JsonRpcSigner | undefined;
  ethersReadonlyProvider: ethers.ContractRunner | undefined;
  sameChain: RefObject<(chainId: number | undefined) => boolean>;
  sameSigner: RefObject<
    (ethersSigner: ethers.JsonRpcSigner | undefined) => boolean
  >;
}) => {
  const {
    instance,
    fhevmDecryptionSignatureStorage,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  } = parameters;

  const [message, setMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const payrollDappRef = useRef<PayrollDappInfoType | undefined>(undefined);

  const payrollDapp = useMemo(() => {
    const c = getPayrollDappByChainId(chainId);
    payrollDappRef.current = c;
    // Only show message if chainId is defined and contract address is missing
    if (chainId !== undefined && !c.address) {
      setMessage(`PayrollDapp deployment not found for chainId=${chainId}.`);
    } else if (chainId === undefined) {
      // Clear message when chainId is undefined
      setMessage("");
    }
    return c;
  }, [chainId]);

  const isDeployed = useMemo(() => {
    if (!payrollDapp) {
      return undefined;
    }
    return Boolean(payrollDapp.address && payrollDapp.address !== ethers.ZeroAddress);
  }, [payrollDapp]);

  // Add Employee
  const addEmployee = useCallback(
    async (
      employeeAddress: string,
      departmentHash: string,
      salary: number
    ) => {
      if (!payrollDapp.address || !instance || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Encrypting salary...");

      try {
        const input = instance.createEncryptedInput(
          payrollDapp.address,
          ethersSigner.address
        );
        input.add32(salary);

        const enc = await input.encrypt();

        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        setMessage("Adding employee to contract...");
        const tx = await contract.addEmployee(
          employeeAddress,
          departmentHash,
          enc.handles[0],
          enc.inputProof
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage("Employee added successfully!");
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, instance, ethersSigner]
  );

  // Get and Decrypt Salary
  const getEncryptedSalary = useCallback(
    async (employeeAddress: string) => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return null;
      }

      setIsLoading(true);
      setMessage("Getting encrypted salary...");

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );
        
        // First, send a transaction to ensure ACL is set for the caller
        const tx = await contract.getEncryptedSalary(employeeAddress);
        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();

        // Then, use staticCall to get the return value (encrypted handle)
        const encryptedHandle = await contract.getEncryptedSalary.staticCall(employeeAddress);
        setMessage("Encrypted salary retrieved successfully!");
        return typeof encryptedHandle === 'string' ? encryptedHandle : String(encryptedHandle);
      } catch (error) {
        setMessage(`Error getting salary: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner]
  );

  const decryptSalary = useCallback(
    async (encryptedHandle: string) => {
      if (!payrollDapp.address || !instance || !ethersSigner) {
        setMessage("FHEVM instance or signer not available");
        return null;
      }

      setIsLoading(true);
      setMessage("Decrypting salary...");

      try {
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [payrollDapp.address],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return null;
        }

        const res = await instance.userDecrypt(
          [{ handle: encryptedHandle, contractAddress: payrollDapp.address }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        setMessage("Salary decrypted successfully!");
        return res[encryptedHandle];
      } catch (error) {
        setMessage(`Decryption error: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [
      payrollDapp.address,
      instance,
      ethersSigner,
      fhevmDecryptionSignatureStorage,
    ]
  );

  // Grant Bonus
  const grantBonus = useCallback(
    async (
      employeeAddress: string,
      bonusAmount: number,
      reasonHash: string
    ) => {
      if (!payrollDapp.address || !instance || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Encrypting bonus...");

      try {
        const input = instance.createEncryptedInput(
          payrollDapp.address,
          ethersSigner.address
        );
        input.add32(bonusAmount);

        const enc = await input.encrypt();

        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        setMessage("Granting bonus...");
        const tx = await contract.grantBonus(
          employeeAddress,
          enc.handles[0],
          reasonHash,
          enc.inputProof
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage("Bonus granted successfully!");
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, instance, ethersSigner]
  );

  // Role helpers
  const ROLE_HASHES = useMemo(() => {
    return {
      SUPER_ADMIN_ROLE: ethers.keccak256(ethers.toUtf8Bytes("SUPER_ADMIN_ROLE")),
      FINANCE_ADMIN_ROLE: ethers.keccak256(ethers.toUtf8Bytes("FINANCE_ADMIN_ROLE")),
      DEPARTMENT_MANAGER_ROLE: ethers.keccak256(ethers.toUtf8Bytes("DEPARTMENT_MANAGER_ROLE")),
      EMPLOYEE_ROLE: ethers.keccak256(ethers.toUtf8Bytes("EMPLOYEE_ROLE")),
      NONE: "0x0000000000000000000000000000000000000000000000000000000000000000",
    };
  }, []);

  const resolveRoleName = useCallback((roleBytes32: string | undefined): string | null => {
    if (!roleBytes32) return null;
    if (roleBytes32 === ROLE_HASHES.NONE) return "NONE";
    if (roleBytes32 === ROLE_HASHES.SUPER_ADMIN_ROLE) return "SUPER_ADMIN_ROLE";
    if (roleBytes32 === ROLE_HASHES.FINANCE_ADMIN_ROLE) return "FINANCE_ADMIN_ROLE";
    if (roleBytes32 === ROLE_HASHES.DEPARTMENT_MANAGER_ROLE) return "DEPARTMENT_MANAGER_ROLE";
    if (roleBytes32 === ROLE_HASHES.EMPLOYEE_ROLE) return "EMPLOYEE_ROLE";
    return roleBytes32; // fallback: show raw bytes32
  }, [ROLE_HASHES]);

  // Get user role (read-only)
  const getUserRole = useCallback(
    async (userAddress: string): Promise<string | null> => {
      if (!payrollDapp.address) {
        return null;
      }
      try {
        const runner: ethers.ContractRunner | null =
          ethersReadonlyProvider ?? ethersSigner ?? null;
        if (!runner) {
          return null;
        }
        // Check contract code exists at address to avoid calling non-contract
        const providerLike: any =
          (ethersReadonlyProvider as any) ?? (ethersSigner as any)?.provider ?? null;
        // On localhost (31337), some nodes may reject eth_getCode with stale block tag errors.
        // Skip hard failure there; still try to read role.
        if (providerLike?.getCode && chainId !== 31337) {
          try {
            const code = await providerLike.getCode(payrollDapp.address);
            if (!code || code === "0x") {
              setMessage(
                `No contract code at ${payrollDapp.address}. Regenerate addresses (npm run genabi) or redeploy.`
              );
              return null;
            }
          } catch {
            // Ignore getCode issues and proceed to try contract call
          }
        }
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          runner
        );
        try {
          const role: string = await contract.getUserRole(userAddress);
          return resolveRoleName(role);
        } catch (inner) {
          // Fallback: try reading superAdmin() to infer role
          try {
            const superAdminAddr: string = await (contract as any).superAdmin();
            if (
              superAdminAddr &&
              userAddress &&
              superAdminAddr.toLowerCase() === userAddress.toLowerCase()
            ) {
              return "SUPER_ADMIN_ROLE";
            }
          } catch {
            // ignore
          }
          throw inner;
        }
      } catch (error) {
        // Avoid noisy errors; return a neutral result
        return null;
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersReadonlyProvider, ethersSigner, resolveRoleName, chainId]
  );

  // Batch Grant Bonus
  const batchGrantBonus = useCallback(
    async (
      employeeAddresses: string[],
      bonusAmounts: number[],
      reasonHash: string
    ) => {
      if (!payrollDapp.address || !instance || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      if (employeeAddresses.length !== bonusAmounts.length || employeeAddresses.length === 0) {
        setMessage("Employee addresses and bonus amounts must match and not be empty");
        return;
      }

      setIsLoading(true);
      setMessage("Encrypting bonuses...");

      try {
        const encryptedBonuses: string[] = [];
        const inputProofs: string[] = [];

        for (let i = 0; i < employeeAddresses.length; i++) {
          const input = instance.createEncryptedInput(
            payrollDapp.address,
            ethersSigner.address
          );
          input.add32(bonusAmounts[i]);
          const enc = await input.encrypt();
          encryptedBonuses.push(ethers.hexlify(enc.handles[0]));
          inputProofs.push(ethers.hexlify(enc.inputProof));
        }

        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        setMessage("Granting batch bonuses...");
        const tx = await contract.batchGrantBonus(
          employeeAddresses,
          encryptedBonuses,
          reasonHash,
          inputProofs
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage(`Batch bonus granted successfully to ${employeeAddresses.length} employees!`);
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, instance, ethersSigner]
  );

  // Request Salary Adjustment
  const requestSalaryAdjustment = useCallback(
    async (
      employeeAddress: string,
      requestedSalary: number,
      reasonHash: string
    ) => {
      if (!payrollDapp.address || !instance || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Encrypting requested salary...");

      try {
        const input = instance.createEncryptedInput(
          payrollDapp.address,
          ethersSigner.address
        );
        input.add32(requestedSalary);

        const enc = await input.encrypt();

        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        setMessage("Submitting salary adjustment request...");
        const tx = await contract.requestSalaryAdjustment(
          employeeAddress,
          enc.handles[0],
          reasonHash,
          enc.inputProof
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // Get the request ID from the event or by querying the count
        let requestId: string | null = null;
        try {
          // Try to get request ID from event logs
          const event = receipt.logs.find((log: any) => {
            try {
              const parsedLog = contract.interface.parseLog(log);
              return parsedLog && parsedLog.name === "SalaryAdjustmentRequested";
            } catch {
              return false;
            }
          });
          
          if (event) {
            const parsedLog = contract.interface.parseLog(event);
            if (parsedLog && parsedLog.args) {
              requestId = parsedLog.args[2].toString(); // requestId is the third argument
            }
          }
          
          // Fallback: get from count if event parsing failed
          if (!requestId) {
            const count = await contract.getSalaryAdjustmentRequestCount();
            requestId = (BigInt(count.toString()) - 1n).toString();
          }
        } catch (err) {
          // If both methods fail, just show success message without ID
          console.error("Error getting request ID:", err);
        }
        
        if (requestId !== null) {
          setMessage(`Salary adjustment request submitted successfully! Request ID: ${requestId}`);
        } else {
          setMessage("Salary adjustment request submitted successfully!");
        }
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, instance, ethersSigner]
  );

  // Approve Salary Adjustment
  const approveSalaryAdjustment = useCallback(
    async (requestId: number) => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Approving salary adjustment...");

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        const tx = await contract.approveSalaryAdjustment(requestId);

        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage("Salary adjustment approved successfully!");
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner]
  );

  // Execute Salary Adjustment
  const executeSalaryAdjustment = useCallback(
    async (requestId: number) => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Executing salary adjustment...");

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        const tx = await contract.executeSalaryAdjustment(requestId);

        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage("Salary adjustment executed successfully!");
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner]
  );

  // Update Salary (direct, bypasses approval)
  const updateSalary = useCallback(
    async (
      employeeAddress: string,
      newSalary: number,
      reasonHash: string
    ) => {
      if (!payrollDapp.address || !instance || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Encrypting new salary...");

      try {
        const input = instance.createEncryptedInput(
          payrollDapp.address,
          ethersSigner.address
        );
        input.add32(newSalary);

        const enc = await input.encrypt();

        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        setMessage("Updating salary...");
        const tx = await contract.updateSalary(
          employeeAddress,
          enc.handles[0],
          reasonHash,
          enc.inputProof
        );

        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage("Salary updated successfully!");
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, instance, ethersSigner]
  );

  // Assign Role
  const assignRole = useCallback(
    async (userAddress: string, role: string) => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Assigning role...");

      try {
        const roleHash = ROLE_HASHES[role as keyof typeof ROLE_HASHES];
        if (!roleHash) {
          setMessage("Invalid role");
          setIsLoading(false);
          return;
        }

        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        const tx = await contract.assignRole(userAddress, roleHash);

        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage(`Role ${role} assigned successfully!`);
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner, ROLE_HASHES]
  );

  // Revoke Role
  const revokeRole = useCallback(
    async (userAddress: string) => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Revoking role...");

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        const tx = await contract.revokeRole(userAddress);

        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage("Role revoked successfully!");
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner]
  );

  // Get Audit Statistics
  const getAuditStatistics = useCallback(
    async () => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return null;
      }

      setIsLoading(true);
      setMessage("Getting audit statistics (this will set ACL permissions)...");

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );
        
        // Send actual transaction to set ACL permissions
        const tx = await contract.getAuditStatistics();
        setMessage(`Transaction sent: ${tx.hash}. Waiting for confirmation...`);
        await tx.wait();
        
        // After transaction confirms, use staticCall to get the result
        // The ACL should now be set, so we can get the encrypted handles
        const stats = await contract.getAuditStatistics.staticCall();
        setMessage("Audit statistics retrieved successfully!");
        return {
          totalPayroll: stats[0],
          totalBonuses: stats[1],
          totalEmployees: stats[2].toString(),
          totalAdjustments: stats[3].toString(),
          totalBonusRecords: stats[4].toString(),
        };
      } catch (error) {
        setMessage(`Error getting audit statistics: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner]
  );

  // Get Role Change Record Count
  const getRoleChangeRecordCount = useCallback(
    async () => {
      if (!payrollDapp.address || !ethersReadonlyProvider) {
        return null;
      }

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersReadonlyProvider
        );
        const count = await contract.getRoleChangeRecordCount();
        return count.toString();
      } catch (error) {
        return null;
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersReadonlyProvider]
  );

  // Get Salary Adjustment Request Count
  const getSalaryAdjustmentRequestCount = useCallback(
    async () => {
      if (!payrollDapp.address || !ethersReadonlyProvider) {
        return null;
      }

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersReadonlyProvider
        );
        const count = await contract.getSalaryAdjustmentRequestCount();
        return count.toString();
      } catch (error) {
        return null;
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersReadonlyProvider]
  );


  // Get Department Encrypted Payroll
  const getDepartmentEncryptedPayroll = useCallback(
    async (departmentHash: string) => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return null;
      }

      setIsLoading(true);
      setMessage("Querying department payroll (this will set ACL permissions)...");

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );
        
        // Send actual transaction to set ACL permissions and get the result
        // The function needs to execute to set FHE.allow() for the caller
        const tx = await contract.getDepartmentEncryptedPayroll(departmentHash);
        setMessage(`Transaction sent: ${tx.hash}. Waiting for confirmation...`);
        await tx.wait();
        
        // After transaction confirms, use staticCall to get the result
        // The ACL should now be set, so we can get the handle
        const payroll = await contract.getDepartmentEncryptedPayroll.staticCall(departmentHash);
        setMessage("Department payroll queried successfully!");
        // Convert to string if it's not already
        return typeof payroll === 'string' ? payroll : String(payroll);
      } catch (error) {
        setMessage(`Error getting department payroll: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner]
  );

  // Get Total Encrypted Payroll
  const getTotalEncryptedPayroll = useCallback(
    async () => {
      if (!payrollDapp.address || !ethersReadonlyProvider) {
        return null;
      }

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersReadonlyProvider
        );
        const payroll = await contract.getTotalEncryptedPayroll();
        return payroll;
      } catch (error) {
        return null;
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersReadonlyProvider]
  );

  // Get Total Encrypted Bonuses
  const getTotalEncryptedBonuses = useCallback(
    async () => {
      if (!payrollDapp.address || !ethersReadonlyProvider) {
        return null;
      }

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersReadonlyProvider
        );
        const bonuses = await contract.getTotalEncryptedBonuses();
        return bonuses;
      } catch (error) {
        return null;
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersReadonlyProvider]
  );

  // Employee and Department Lists Management
  const addEmployeeAddresses = useCallback(
    async (addresses: string[]) => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Adding employee addresses...");

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        const tx = await contract.addEmployeeAddresses(addresses);
        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage("Employee addresses added successfully!");
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner]
  );

  const removeEmployeeAddress = useCallback(
    async (employeeAddress: string) => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Removing employee address...");

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        const tx = await contract.removeEmployeeAddress(employeeAddress);
        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage("Employee address removed successfully!");
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner]
  );

  const getAllEmployeeAddresses = useCallback(
    async (): Promise<string[]> => {
      if (!payrollDapp.address || !ethersReadonlyProvider) {
        return [];
      }

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersReadonlyProvider
        );
        const addresses = await contract.getAllEmployeeAddresses();
        return addresses;
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
        return [];
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersReadonlyProvider]
  );

  const addDepartmentNames = useCallback(
    async (names: string[]) => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Adding department names...");

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        const tx = await contract.addDepartmentNames(names);
        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage("Department names added successfully!");
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner]
  );

  const removeDepartmentName = useCallback(
    async (departmentName: string) => {
      if (!payrollDapp.address || !ethersSigner) {
        setMessage("Contract not available or not connected");
        return;
      }

      setIsLoading(true);
      setMessage("Removing department name...");

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersSigner
        );

        const tx = await contract.removeDepartmentName(departmentName);
        setMessage(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        setMessage("Department name removed successfully!");
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersSigner]
  );

  const getAllDepartmentNames = useCallback(
    async (): Promise<string[]> => {
      if (!payrollDapp.address || !ethersReadonlyProvider) {
        return [];
      }

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersReadonlyProvider
        );
        const names = await contract.getAllDepartmentNames();
        return names;
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
        return [];
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersReadonlyProvider]
  );

  const checkEmployeeExists = useCallback(
    async (employeeAddress: string): Promise<boolean> => {
      if (!payrollDapp.address || !ethersReadonlyProvider) {
        return false;
      }

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersReadonlyProvider
        );
        const employee = await contract.employees(employeeAddress);
        return employee.isActive;
      } catch (error) {
        return false;
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersReadonlyProvider]
  );

  // Get employee department hash
  const getEmployeeDepartment = useCallback(
    async (employeeAddress: string): Promise<string | null> => {
      if (!payrollDapp.address || !ethersReadonlyProvider) {
        return null;
      }

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersReadonlyProvider
        );
        const deptHash = await contract.employeeDepartments(employeeAddress);
        // Return null if department hash is zero (not assigned)
        if (deptHash === ethers.ZeroHash || deptHash === "0x0000000000000000000000000000000000000000000000000000000000000000") {
          return null;
        }
        return deptHash;
      } catch (error) {
        return null;
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersReadonlyProvider]
  );

  // Get employees in a specific department
  const getDepartmentEmployees = useCallback(
    async (departmentHash: string): Promise<string[]> => {
      if (!payrollDapp.address || !ethersReadonlyProvider) {
        return [];
      }

      try {
        const contract = new ethers.Contract(
          payrollDapp.address,
          payrollDapp.abi,
          ethersReadonlyProvider
        );
        // Get all employees and filter by department
        const allEmployees = await contract.getAllEmployeeAddresses();
        const deptEmployees: string[] = [];
        
        for (const empAddr of allEmployees) {
          const empDeptHash = await contract.employeeDepartments(empAddr);
          if (empDeptHash === departmentHash) {
            const employee = await contract.employees(empAddr);
            if (employee.isActive) {
              deptEmployees.push(empAddr);
            }
          }
        }
        
        return deptEmployees;
      } catch (error) {
        setMessage(`Error: ${error instanceof Error ? error.message : String(error)}`);
        return [];
      }
    },
    [payrollDapp.address, payrollDapp.abi, ethersReadonlyProvider]
  );

  return {
    contractAddress: payrollDapp.address,
    isDeployed,
    message,
    isLoading,
    addEmployee,
    getEncryptedSalary,
    decryptSalary,
    grantBonus,
    batchGrantBonus,
    requestSalaryAdjustment,
    approveSalaryAdjustment,
    executeSalaryAdjustment,
    updateSalary,
    assignRole,
    revokeRole,
    getAuditStatistics,
    getRoleChangeRecordCount,
    getSalaryAdjustmentRequestCount,
    getDepartmentEncryptedPayroll,
    getTotalEncryptedPayroll,
    getTotalEncryptedBonuses,
    getUserRole,
    ROLE_HASHES,
    resolveRoleName,
    addEmployeeAddresses,
    removeEmployeeAddress,
    getAllEmployeeAddresses,
    addDepartmentNames,
    removeDepartmentName,
    getAllDepartmentNames,
    checkEmployeeExists,
    getEmployeeDepartment,
    getDepartmentEmployees,
  };
};

