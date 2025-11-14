"use client";

export const dynamic = "force-dynamic";

import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { usePayrollDapp } from "@/hooks/usePayrollDapp";
import { useEffect, useState } from "react";
import { ethers } from "ethers";

// Icon components (simple SVG icons)
const IconWallet = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const IconUser = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const IconDollar = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconStar = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
  </svg>
);

const IconChart = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconList = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const IconBuilding = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

export default function Home() {
  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    accounts,
    isConnected,
    connect,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const payrollDapp = usePayrollDapp({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  // State variables
  const [employeeAddress, setEmployeeAddress] = useState("");
  const [departmentName, setDepartmentName] = useState("Engineering");
  const [salary, setSalary] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");
  const [reason, setReason] = useState("");
  const [viewEmployeeAddress, setViewEmployeeAddress] = useState("");
  const [decryptedSalary, setDecryptedSalary] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("");
  
  // Salary adjustment
  const [requestedSalary, setRequestedSalary] = useState("");
  const [adjustmentReason, setAdjustmentReason] = useState("");
  const [requestId, setRequestId] = useState("");
  
  // Role management
  const [roleUserAddress, setRoleUserAddress] = useState("");
  const [selectedRole, setSelectedRole] = useState("EMPLOYEE_ROLE");
  
  // Statistics
  const [auditStats, setAuditStats] = useState<any>(null);
  const [departmentHash, setDepartmentHash] = useState("");
  // Department payroll
  const [departmentPayrollHandle, setDepartmentPayrollHandle] = useState<string | null>(null);
  const [decryptedDepartmentPayroll, setDecryptedDepartmentPayroll] = useState<string | null>(null);
  
  // Employee and Department Lists
  const [employeeAddressList, setEmployeeAddressList] = useState<string[]>([]);
  const [departmentNameList, setDepartmentNameList] = useState<string[]>([]);
  const [bulkDepartmentNames, setBulkDepartmentNames] = useState("");
  
  // Current user's department
  const [currentUserDepartmentHash, setCurrentUserDepartmentHash] = useState<string | null>(null);
  const [currentUserDepartmentName, setCurrentUserDepartmentName] = useState<string | null>(null);
  const [currentUserDepartmentEmployees, setCurrentUserDepartmentEmployees] = useState<string[]>([]);

  // Load employee addresses and department names
  useEffect(() => {
    let cancelled = false;
    const loadLists = async () => {
      if (!payrollDapp.contractAddress) {
        return;
      }
      try {
        const addresses = await payrollDapp.getAllEmployeeAddresses();
        const names = await payrollDapp.getAllDepartmentNames();
        if (!cancelled) {
          setEmployeeAddressList(addresses);
          setDepartmentNameList(names);
        }
      } catch (error) {
        console.error("Error loading lists:", error);
      }
    };
    loadLists();
    return () => {
      cancelled = true;
    };
  }, [payrollDapp.contractAddress, payrollDapp.getAllEmployeeAddresses, payrollDapp.getAllDepartmentNames, payrollDapp.message]);

  // Load current user's role and department when account/chain/contract changes
  useEffect(() => {
    let cancelled = false;
    const loadRoleAndDepartment = async () => {
      if (!accounts || accounts.length === 0) {
        setCurrentRole(null);
        setCurrentUserDepartmentHash(null);
        setCurrentUserDepartmentName(null);
        setCurrentUserDepartmentEmployees([]);
        setActiveTab("");
        return;
      }
      try {
        const role = await payrollDapp.getUserRole(accounts[0]);
        if (!cancelled) {
          setCurrentRole(role);
          setActiveTab("");
        }
        
        // Load user's department if they are a department manager or finance admin
        if (role === "DEPARTMENT_MANAGER_ROLE" || role === "FINANCE_ADMIN_ROLE") {
          const deptHash = await payrollDapp.getEmployeeDepartment(accounts[0]);
          if (!cancelled && deptHash) {
            setCurrentUserDepartmentHash(deptHash);
            
            // Find department name from hash
            const allDeptNames = await payrollDapp.getAllDepartmentNames();
            for (const deptName of allDeptNames) {
              const hash = ethers.keccak256(ethers.toUtf8Bytes(deptName));
              if (hash === deptHash) {
                if (!cancelled) {
                  setCurrentUserDepartmentName(deptName);
                  // Auto-set department name for department payroll view
                  setDepartmentName(deptName);
                }
                break;
              }
            }
            
            // Load employees in this department
            const deptEmployees = await payrollDapp.getDepartmentEmployees(deptHash);
            if (!cancelled) {
              setCurrentUserDepartmentEmployees(deptEmployees);
            }
          }
        } else {
          if (!cancelled) {
            setCurrentUserDepartmentHash(null);
            setCurrentUserDepartmentName(null);
            setCurrentUserDepartmentEmployees([]);
          }
        }
      } catch {
        if (!cancelled) {
          setCurrentRole(null);
          setCurrentUserDepartmentHash(null);
          setCurrentUserDepartmentName(null);
          setCurrentUserDepartmentEmployees([]);
          setActiveTab("");
        }
      }
    };
    loadRoleAndDepartment();
    return () => {
      cancelled = true;
    };
  }, [accounts, chainId, payrollDapp.contractAddress, ethersSigner, payrollDapp.getUserRole, payrollDapp.getEmployeeDepartment, payrollDapp.getAllDepartmentNames, payrollDapp.getDepartmentEmployees]);

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-4">
              <IconWallet />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">PayrollDapp</h1>
            <p className="text-lg text-gray-600">Privacy-Preserving Payroll Management</p>
          </div>
          
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Payroll</h2>
            <p className="text-gray-600 mb-6 text-center">
              Connect your MetaMask wallet to access the encrypted payroll management system powered by Zama FHEVM.
            </p>
            
            <button
              onClick={connect}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-md hover:shadow-lg"
            >
              <IconWallet />
              <span>Connect Wallet</span>
            </button>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 text-center">
                Powered by Fully Homomorphic Encryption (FHE)
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only show "Contract Not Deployed" if chainId is defined and contract is not deployed
  // Don't show if chainId is undefined (still connecting) or if contract is already deployed
  if (chainId !== undefined && payrollDapp.isDeployed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-amber-900 mb-2">Contract Not Deployed</h2>
                <p className="text-amber-800 mb-4">
                  The PayrollDapp smart contract is not yet deployed on network (Chain ID: {chainId}).
                </p>
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <p className="text-sm text-gray-700 font-medium mb-2">To deploy the contract:</p>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Navigate to the contracts directory</li>
                    <li>Run the deployment script</li>
                    <li>Generate ABI using <code className="bg-gray-100 px-2 py-1 rounded text-xs">npm run genabi</code></li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAddEmployee = async () => {
    if (!employeeAddress || !departmentName || !salary) {
      alert("Please fill in all fields");
      return;
    }
    const departmentHash = ethers.keccak256(ethers.toUtf8Bytes(departmentName));
    await payrollDapp.addEmployee(employeeAddress, departmentHash, parseInt(salary));
    // Add address to the list if not already there
    try {
      await payrollDapp.addEmployeeAddresses([employeeAddress]);
      // Reload list
      const updated = await payrollDapp.getAllEmployeeAddresses();
      setEmployeeAddressList(updated);
    } catch (error) {
      // Address might already be in list, ignore error
      console.log("Address might already be in list");
    }
    // Clear form
    setEmployeeAddress("");
    setSalary("");
  };

  const handleGrantBonus = async () => {
    if (!employeeAddress || !bonusAmount || !reason) {
      alert("Please fill in all fields");
      return;
    }
    const reasonHash = ethers.keccak256(ethers.toUtf8Bytes(reason));
    await payrollDapp.grantBonus(employeeAddress, parseInt(bonusAmount), reasonHash);
  };


  const handleRequestSalaryAdjustment = async () => {
    if (!employeeAddress || !requestedSalary || !adjustmentReason) {
      alert("Please fill in all fields");
      return;
    }
    const reasonHash = ethers.keccak256(ethers.toUtf8Bytes(adjustmentReason));
    await payrollDapp.requestSalaryAdjustment(employeeAddress, parseInt(requestedSalary), reasonHash);
  };

  const handleApproveSalaryAdjustment = async () => {
    if (!requestId) {
      alert("Please enter request ID");
      return;
    }
    await payrollDapp.approveSalaryAdjustment(parseInt(requestId));
  };

  const handleExecuteSalaryAdjustment = async () => {
    if (!requestId) {
      alert("Please enter request ID");
      return;
    }
    await payrollDapp.executeSalaryAdjustment(parseInt(requestId));
  };

  const handleUpdateSalary = async () => {
    if (!employeeAddress || !requestedSalary || !adjustmentReason) {
      alert("Please fill in all fields");
      return;
    }
    const reasonHash = ethers.keccak256(ethers.toUtf8Bytes(adjustmentReason));
    await payrollDapp.updateSalary(employeeAddress, parseInt(requestedSalary), reasonHash);
  };

  const handleAssignRole = async () => {
    if (!roleUserAddress || !selectedRole) {
      alert("Please fill in all fields");
      return;
    }
    await payrollDapp.assignRole(roleUserAddress, selectedRole);
  };

  const handleRevokeRole = async () => {
    if (!roleUserAddress) {
      alert("Please enter user address");
      return;
    }
    await payrollDapp.revokeRole(roleUserAddress);
  };

  const handleViewSalary = async () => {
    if (!viewEmployeeAddress) {
      alert("Please enter employee address");
      return;
    }
    const encryptedHandle = await payrollDapp.getEncryptedSalary(viewEmployeeAddress);
    if (encryptedHandle) {
      const decrypted = await payrollDapp.decryptSalary(encryptedHandle);
      if (decrypted !== null) {
        setDecryptedSalary(String(decrypted));
      }
    }
  };

  const handleLoadAuditStats = async () => {
    const stats = await payrollDapp.getAuditStatistics();
    setAuditStats(stats);
  };



  const handleBulkAddDepartmentNames = async () => {
    if (!bulkDepartmentNames.trim()) {
      alert("Please enter department names");
      return;
    }
    const names = bulkDepartmentNames
      .split(",")
      .map(n => n.trim())
      .filter(n => n.length > 0);
    if (names.length === 0) {
      alert("No valid department names found");
      return;
    }
    await payrollDapp.addDepartmentNames(names);
    // Reload list
    const updated = await payrollDapp.getAllDepartmentNames();
    setDepartmentNameList(updated);
    setBulkDepartmentNames("");
  };

  const handleRemoveDepartmentName = async (name: string) => {
    if (confirm(`Remove department name ${name}?`)) {
      await payrollDapp.removeDepartmentName(name);
      // Reload list
      const updated = await payrollDapp.getAllDepartmentNames();
      setDepartmentNameList(updated);
    }
  };

  const isSuperAdmin = currentRole === "SUPER_ADMIN_ROLE";
  const isFinanceAdmin = currentRole === "FINANCE_ADMIN_ROLE";
  const isDepartmentManager = currentRole === "DEPARTMENT_MANAGER_ROLE";
  const isEmployee = currentRole === "EMPLOYEE_ROLE";

  // Define tabs based on role
  const tabs = [];
  if (isSuperAdmin) {
    // Super Admin: All panels
    tabs.push(
      { id: "manage", label: "Lists Management", description: "Manage employees and departments", icon: "list", color: "blue" },
      { id: "addEmployee", label: "Add Employee", description: "Register new employees", icon: "user", color: "green" },
      { id: "viewSalary", label: "View Salary", description: "View and decrypt salary data", icon: "dollar", color: "blue" },
      { id: "bonus", label: "Bonus Management", description: "Grant employee bonuses", icon: "star", color: "yellow" },
      { id: "salary", label: "Salary Adjustment", description: "Manage salary changes", icon: "dollar", color: "indigo" },
      { id: "role", label: "Role Management", description: "Assign and revoke user roles", icon: "settings", color: "blue" },
      { id: "audit", label: "Audit Statistics", description: "View system statistics", icon: "chart", color: "purple" },
      { id: "department", label: "Department Payroll", description: "View department summaries", icon: "building", color: "teal" }
    );
  } else if (isFinanceAdmin) {
    // Finance Admin: Salary Adjustment, Audit Statistics, View & Decrypt Salary
    tabs.push(
      { id: "salary", label: "Salary Adjustment", description: "Manage salary changes", icon: "dollar", color: "indigo" },
      { id: "audit", label: "Audit Statistics", description: "View system statistics", icon: "chart", color: "purple" },
      { id: "viewSalary", label: "View Salary", description: "View and decrypt salary data", icon: "dollar", color: "blue" }
    );
  } else if (isDepartmentManager) {
    // Department Manager: Salary Adjustment, Department Payroll Summary, View & Decrypt Salary
    tabs.push(
      { id: "salary", label: "Salary Adjustment", description: "Request salary changes", icon: "dollar", color: "indigo" },
      { id: "department", label: "Department Payroll", description: "View department summaries", icon: "building", color: "teal" },
      { id: "viewSalary", label: "View Salary", description: "View and decrypt salary data", icon: "dollar", color: "blue" }
    );
  } else if (isEmployee) {
    // Employee: View & Decrypt Salary only
    tabs.push(
      { id: "viewSalary", label: "View Salary", description: "View and decrypt your salary", icon: "dollar", color: "blue" }
    );
  }
  
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "list": return <IconList />;
      case "user": return <IconUser />;
      case "dollar": return <IconDollar />;
      case "star": return <IconStar />;
      case "chart": return <IconChart />;
      case "settings": return <IconSettings />;
      case "building": return <IconBuilding />;
      default: return <IconDollar />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <IconDollar />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PayrollDapp</h1>
                <p className="text-xs text-gray-500">Privacy-Preserving Payroll System</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {accounts && accounts.length > 0 ? `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}` : ""}
                </span>
              </div>
              
              {currentRole && (
                <div className="flex flex-col items-end">
                  <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                    <span className="text-sm font-medium text-blue-700">
                      {currentRole === "SUPER_ADMIN_ROLE" ? "Super Admin" :
                       currentRole === "FINANCE_ADMIN_ROLE" ? "Finance Admin" :
                       currentRole === "DEPARTMENT_MANAGER_ROLE" ? "Department Manager" :
                       currentRole === "EMPLOYEE_ROLE" ? "Employee" : "No Role"}
                    </span>
                  </div>
                  <div className="mt-1 px-3 py-1">
                    <span className="text-xs text-gray-600">
                      {currentRole === "SUPER_ADMIN_ROLE" ? "Full permissions" :
                       currentRole === "FINANCE_ADMIN_ROLE" ? "Approve salary adjustments, view financial status" :
                       currentRole === "DEPARTMENT_MANAGER_ROLE" ? "Request salary adjustments, view department payroll" :
                       currentRole === "EMPLOYEE_ROLE" ? "View personal salary only" : ""}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* System Status Bar */}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Chain ID:</span>
              <span className="px-2 py-1 bg-gray-100 rounded">{chainId}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">Contract:</span>
              <span className="px-2 py-1 bg-gray-100 rounded font-mono">
                {payrollDapp.contractAddress ? `${payrollDapp.contractAddress.slice(0, 8)}...${payrollDapp.contractAddress.slice(-6)}` : "Not deployed"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-700">FHEVM:</span>
              <span className={`px-2 py-1 rounded font-medium ${
                fhevmStatus === "ready" ? "bg-green-100 text-green-700" : 
                fhevmStatus === "loading" ? "bg-yellow-100 text-yellow-700" : 
                "bg-red-100 text-red-700"
              }`}>
                {fhevmStatus}
              </span>
            </div>
            {fhevmError && (
              <div className="flex items-center gap-2 text-red-600">
                <span className="font-medium">Error:</span>
                <span>{fhevmError.message}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Message Banner */}
      {payrollDapp.message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 animate-fadeIn">
          <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-800 font-medium">{payrollDapp.message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
      {/* Initial Feature Selection View */}
      {!activeTab && (
        <div className="animate-fadeIn">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Payroll Dapp</h2>
            <p className="text-lg text-gray-600">Select a feature to get started</p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {tabs.map((tab) => {
              const colorClasses: {[key: string]: string} = {
                blue: "bg-blue-100 hover:bg-blue-200 border-blue-300",
                green: "bg-green-100 hover:bg-green-200 border-green-300",
                yellow: "bg-yellow-100 hover:bg-yellow-200 border-yellow-300",
                indigo: "bg-indigo-100 hover:bg-indigo-200 border-indigo-300",
                purple: "bg-purple-100 hover:bg-purple-200 border-purple-300",
                teal: "bg-teal-100 hover:bg-teal-200 border-teal-300",
              };
              
              const iconColorClasses: {[key: string]: string} = {
                blue: "text-blue-700",
                green: "text-green-700",
                yellow: "text-yellow-700",
                indigo: "text-indigo-700",
                purple: "text-purple-700",
                teal: "text-teal-700",
              };
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${colorClasses[tab.color]} aspect-square border-2 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-200 hover:shadow-xl transform hover:scale-105 group`}
                >
                  <div className={`${iconColorClasses[tab.color]} mb-3 transform group-hover:scale-110 transition-transform duration-200`}>
                    {getIconComponent(tab.icon)}
                  </div>
                  <h3 className={`text-sm font-bold ${iconColorClasses[tab.color]}`}>{tab.label}</h3>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Back Button (shown when in a feature view) */}
      {activeTab && (
        <div className="mb-6 animate-fadeIn">
          <button
            onClick={() => setActiveTab("")}
            className="inline-flex items-center gap-2 px-5 py-3 bg-white border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md group"
          >
            <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Menu</span>
          </button>
        </div>
      )}
      
      {/* Lists Management Tab */}

      {/* Lists Management Tab */}
      {activeTab === "manage" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Employee Addresses Card */}
          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconUser />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Employee Addresses</h2>
                <p className="text-sm text-gray-500">Manage registered employees</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  This list displays all registered employee addresses. Add new employees using the "Add Employee" tab.
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Registered Employees
                  </h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {employeeAddressList.length} {employeeAddressList.length === 1 ? 'employee' : 'employees'}
                  </span>
                </div>
                
                <div className="max-h-96 overflow-y-auto border-2 border-gray-200 rounded-lg bg-gray-50">
                  {employeeAddressList.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <IconUser />
                      </div>
                      <p className="text-sm text-gray-500">No employees registered yet</p>
                      <p className="text-xs text-gray-400 mt-1">Start by adding an employee</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {employeeAddressList.map((address, index) => (
                        <li key={index} className="p-3 hover:bg-white transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <span className="font-mono text-sm text-gray-700 break-all">{address}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Department Names Card */}
          <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm card-hover">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <IconBuilding />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Department Management</h2>
                <p className="text-sm text-gray-500">Add and manage departments</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add Departments (comma-separated)
                </label>
                <textarea
                  value={bulkDepartmentNames}
                  onChange={(e) => setBulkDepartmentNames(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  placeholder="e.g., Engineering, Sales, Marketing, HR, Operations"
                  rows={4}
                />
              </div>
              
              <button
                onClick={handleBulkAddDepartmentNames}
                disabled={payrollDapp.isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {payrollDapp.isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Adding...</span>
                  </>
                ) : (
                  <span>Add Departments</span>
                )}
              </button>
              
              <div className="pt-4 border-t-2 border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Active Departments
                  </h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                    {departmentNameList.length} {departmentNameList.length === 1 ? 'department' : 'departments'}
                  </span>
                </div>
                
                <div className="max-h-60 overflow-y-auto border-2 border-gray-200 rounded-lg bg-gray-50">
                  {departmentNameList.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                        <IconBuilding />
                      </div>
                      <p className="text-sm text-gray-500">No departments created yet</p>
                      <p className="text-xs text-gray-400 mt-1">Add your first department above</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {departmentNameList.map((name, index) => (
                        <li key={index} className="p-3 hover:bg-white transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <IconBuilding />
                              </div>
                              <span className="text-sm font-medium text-gray-700">{name}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveDepartmentName(name)}
                              disabled={payrollDapp.isLoading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs px-3 py-1 rounded-md transition-all disabled:opacity-50 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Tab */}
      {activeTab === "addEmployee" && (
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <IconUser />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Add New Employee</h2>
                <p className="text-sm text-gray-500">Register a new employee with encrypted salary</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> The salary will be encrypted using FHEVM before being stored on the blockchain, ensuring complete privacy.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Employee Wallet Address
                </label>
                <input
                  type="text"
                  value={employeeAddress}
                  onChange={(e) => setEmployeeAddress(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all font-mono"
                  placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the Ethereum address of the employee</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all bg-white"
                >
                  <option value="">Select a department...</option>
                  {departmentNameList.map((name, index) => (
                    <option key={index} value={name}>{name}</option>
                  ))}
                </select>
                {departmentNameList.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">⚠️ No departments available. Please create departments first.</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Monthly Salary (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg pl-8 pr-4 py-3 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                    placeholder="5000"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">This value will be encrypted before being stored</p>
              </div>
              
              <button
                onClick={handleAddEmployee}
                disabled={payrollDapp.isLoading || !employeeAddress || !departmentName || !salary}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {payrollDapp.isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <IconCheck />
                    <span>Add Employee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View & Decrypt Salary Tab */}
      {activeTab === "viewSalary" && (
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconDollar />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">View & Decrypt Salary</h2>
                <p className="text-sm text-gray-500">Access encrypted salary information securely</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Privacy Protection:</strong> Salary data is encrypted on-chain. Only authorized users can decrypt and view the actual values.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {isSuperAdmin ? "Select Employee" : "Your Wallet Address"}
                </label>
                {isSuperAdmin ? (
                  <select
                    value={viewEmployeeAddress}
                    onChange={(e) => setViewEmployeeAddress(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white font-mono"
                  >
                    <option value="">Choose an employee...</option>
                    {employeeAddressList.map((address, index) => (
                      <option key={index} value={address}>{address}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                    <p className="text-sm font-mono text-gray-700">
                      {accounts && accounts.length > 0 ? accounts[0] : "Not connected"}
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {isSuperAdmin ? "Super Admin can view any employee's salary" : "You can only view your own salary"}
                </p>
              </div>
              
              <button
                onClick={async () => {
                  const addressToView = isSuperAdmin ? viewEmployeeAddress : (accounts && accounts.length > 0 ? accounts[0] : "");
                  if (!addressToView) {
                    alert("Please select an employee address");
                    return;
                  }
                  setDecryptedSalary(null); // Reset previous result
                  const encryptedHandle = await payrollDapp.getEncryptedSalary(addressToView);
                  if (encryptedHandle) {
                    const decrypted = await payrollDapp.decryptSalary(encryptedHandle);
                    if (decrypted !== null) {
                      setDecryptedSalary(String(decrypted));
                    }
                  }
                }}
                disabled={payrollDapp.isLoading || (isSuperAdmin && !viewEmployeeAddress)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {payrollDapp.isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Decrypting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span>Decrypt & View Salary</span>
                  </>
                )}
              </button>
              
              {decryptedSalary && (
                <div className="mt-6 p-6 bg-green-50 border-2 border-green-200 rounded-xl animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                      <IconCheck />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-800 mb-1">Decryption Successful</p>
                      <p className="text-xs text-green-700 mb-3">Monthly Salary Amount</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-green-900">${decryptedSalary}</span>
                        <span className="text-sm text-green-700">USD/month</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bonus Management Tab */}
      {activeTab === "bonus" && (
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <IconStar />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Grant Bonus</h2>
                <p className="text-sm text-gray-500">Reward employees with encrypted bonuses</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Bonus System:</strong> Issue one-time bonuses to employees. The bonus amount will be encrypted and recorded on-chain with the specified reason.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Employee
                </label>
                <select
                  value={employeeAddress}
                  onChange={(e) => setEmployeeAddress(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all bg-white font-mono"
                >
                  <option value="">Choose an employee...</option>
                  {employeeAddressList.map((address, index) => (
                    <option key={index} value={address}>{address}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Bonus Amount (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg pl-8 pr-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                    placeholder="1000"
                    min="0"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter the bonus amount to be encrypted</p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Bonus
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 transition-all"
                  placeholder="e.g., Outstanding Q4 performance, Project completion bonus"
                />
                <p className="text-xs text-gray-500 mt-1">Provide a brief description (will be hashed on-chain)</p>
              </div>
              
              <button
                onClick={handleGrantBonus}
                disabled={payrollDapp.isLoading || !employeeAddress || !bonusAmount || !reason}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {payrollDapp.isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <IconStar />
                    <span>Grant Bonus</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary Adjustment Tab */}
      {activeTab === "salary" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Request Salary Adjustment - Only for Department Manager and Super Admin */}
          {(isDepartmentManager || isSuperAdmin) && (
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <IconDollar />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Request Salary Adjustment</h2>
                  <p className="text-xs text-gray-500">Submit a salary change request</p>
                </div>
              </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Address</label>
                <select
                  value={employeeAddress}
                  onChange={(e) => setEmployeeAddress(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all bg-white font-mono"
                >
                  <option value="">Select Employee</option>
                  {(isSuperAdmin ? employeeAddressList : currentUserDepartmentEmployees).map((address, index) => (
                    <option key={index} value={address}>{address}</option>
                  ))}
                </select>
                {!isSuperAdmin && currentUserDepartmentName && (
                  <p className="text-xs text-gray-500 mt-1">
                    Showing employees from your department: {currentUserDepartmentName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Salary (USD)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    value={requestedSalary}
                    onChange={(e) => setRequestedSalary(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg pl-8 pr-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                    placeholder="6000"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Adjustment Reason</label>
                <input
                  type="text"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Outstanding performance"
                />
              </div>
              <button
                onClick={handleRequestSalaryAdjustment}
                disabled={payrollDapp.isLoading || !employeeAddress || !requestedSalary || !adjustmentReason}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {payrollDapp.isLoading ? "Processing..." : "Submit Request"}
              </button>
            </div>
          </div>
          )}

          {isSuperAdmin && (
            <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm card-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <IconSettings />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Direct Update</h2>
                  <p className="text-xs text-gray-500">Bypass approval process</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-xs text-orange-800">
                    <strong>Admin privilege:</strong> Update salary immediately without approval workflow
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Employee Address</label>
                  <select
                    value={employeeAddress}
                    onChange={(e) => setEmployeeAddress(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all bg-white font-mono"
                  >
                    <option value="">Select Employee</option>
                    {employeeAddressList.map((address, index) => (
                      <option key={index} value={address}>{address}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Salary (USD)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      value={requestedSalary}
                      onChange={(e) => setRequestedSalary(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg pl-8 pr-4 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                      placeholder="6000"
                      min="0"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Reason</label>
                  <input
                    type="text"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                    placeholder="Outstanding performance"
                  />
                </div>
                <button
                  onClick={handleUpdateSalary}
                  disabled={payrollDapp.isLoading || !employeeAddress || !requestedSalary || !adjustmentReason}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {payrollDapp.isLoading ? "Processing..." : "Update Immediately"}
                </button>
              </div>
            </div>
          )}

          {(isFinanceAdmin || isSuperAdmin) && (
            <>
              <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <IconCheck />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Approve Request</h2>
                    <p className="text-xs text-gray-500">Approve pending salary adjustments</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Request ID</label>
                    <input
                      type="number"
                      value={requestId}
                      onChange={(e) => setRequestId(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-100 transition-all"
                      placeholder="Enter request ID"
                      min="0"
                    />
                  </div>
                  <button
                    onClick={handleApproveSalaryAdjustment}
                    disabled={payrollDapp.isLoading || !requestId}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {payrollDapp.isLoading ? "Processing..." : "Approve Request"}
                  </button>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-100 rounded-xl p-6 shadow-sm card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                  <h2 className="text-xl font-bold text-gray-900">Execute Adjustment</h2>
                  <p className="text-xs text-gray-500">Execute approved salary adjustments</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Request ID</label>
                    <input
                      type="number"
                      value={requestId}
                      onChange={(e) => setRequestId(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
                      placeholder="Enter request ID"
                      min="0"
                    />
                  </div>
                  <button
                    onClick={handleExecuteSalaryAdjustment}
                    disabled={payrollDapp.isLoading || !requestId}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {payrollDapp.isLoading ? "Processing..." : "Execute Now"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Role Management Tab */}
      {activeTab === "role" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 shadow-sm card-hover">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <IconSettings />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Assign Role</h2>
                <p className="text-sm text-gray-500">Grant access permissions to users</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Role-Based Access:</strong> Assign appropriate roles to control what actions users can perform in the system.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  User Wallet Address
                </label>
                <input
                  type="text"
                  value={roleUserAddress}
                  onChange={(e) => setRoleUserAddress(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono"
                  placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all bg-white"
                >
                  <option value="SUPER_ADMIN_ROLE">🔑 Super Admin - Full system access</option>
                  <option value="FINANCE_ADMIN_ROLE">💼 Finance Admin - Salary & audit management</option>
                  <option value="DEPARTMENT_MANAGER_ROLE">👔 Department Manager - Department oversight</option>
                  <option value="EMPLOYEE_ROLE">👤 Employee - View own salary only</option>
                </select>
              </div>
              
              <button
                onClick={handleAssignRole}
                disabled={payrollDapp.isLoading || !roleUserAddress}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {payrollDapp.isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <IconCheck />
                    <span>Assign Role</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 shadow-sm card-hover">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Revoke Role</h2>
                <p className="text-sm text-gray-500">Remove user permissions</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Revoking a role will immediately remove all associated permissions for this user.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  User Wallet Address
                </label>
                <input
                  type="text"
                  value={roleUserAddress}
                  onChange={(e) => setRoleUserAddress(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all font-mono"
                  placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                />
                <p className="text-xs text-gray-500 mt-1">Enter the address of the user whose role you want to revoke</p>
              </div>
              
              <button
                onClick={handleRevokeRole}
                disabled={payrollDapp.isLoading || !roleUserAddress}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {payrollDapp.isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Revoke Role</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Statistics Tab */}
      {activeTab === "audit" && (
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <IconChart />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Audit Statistics</h2>
                <p className="text-sm text-gray-500">View system-wide statistics and metrics</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  <strong>Audit Overview:</strong> Access comprehensive statistics about employees, salary adjustments, and bonus records in the system.
                </p>
              </div>
              
              <button
                onClick={handleLoadAuditStats}
                disabled={payrollDapp.isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {payrollDapp.isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <IconChart />
                    <span>Load Audit Statistics</span>
                  </>
                )}
              </button>
              
              {auditStats && (
                <div className="mt-6 space-y-3 animate-fadeIn">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <IconUser />
                        <p className="text-xs font-semibold text-blue-700 uppercase">Employees</p>
                      </div>
                      <p className="text-3xl font-bold text-blue-900">{auditStats.totalEmployees}</p>
                      <p className="text-xs text-blue-600 mt-1">Total registered</p>
                    </div>
                    
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <IconDollar />
                        <p className="text-xs font-semibold text-green-700 uppercase">Adjustments</p>
                      </div>
                      <p className="text-3xl font-bold text-green-900">{auditStats.totalAdjustments}</p>
                      <p className="text-xs text-green-600 mt-1">Salary changes</p>
                    </div>
                    
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <IconStar />
                        <p className="text-xs font-semibold text-yellow-700 uppercase">Bonuses</p>
                      </div>
                      <p className="text-3xl font-bold text-yellow-900">{auditStats.totalBonusRecords}</p>
                      <p className="text-xs text-yellow-600 mt-1">Bonus records</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-gray-600">
                      <strong>Note:</strong> Total payroll and bonus amounts are encrypted on-chain. Decrypt individual records to view actual values.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Department Payroll Summary Tab */}
      {activeTab === "department" && (
        <div className="max-w-2xl mx-auto animate-fadeIn">
          <div className="bg-white border-2 border-gray-100 rounded-xl p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <IconBuilding />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Department Payroll</h2>
                <p className="text-sm text-gray-500">View aggregated department salary data</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <p className="text-sm text-teal-800">
                  <strong>Department Overview:</strong> Query and decrypt the total payroll for any department. Data is encrypted to protect individual salaries.
                  {!isSuperAdmin && currentUserDepartmentName && (
                    <span className="block mt-2 font-semibold">Your Department: {currentUserDepartmentName}</span>
                  )}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {isSuperAdmin ? "Select Department" : "Your Department"}
                </label>
                {isSuperAdmin ? (
                  <select
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-100 transition-all bg-white"
                  >
                    <option value="">Choose a department...</option>
                    {departmentNameList.map((name, index) => (
                      <option key={index} value={name}>{name}</option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 bg-gray-50">
                    <p className="text-sm font-medium text-gray-700">
                      {currentUserDepartmentName || "No department assigned"}
                    </p>
                    {currentUserDepartmentName && (
                      <input
                        type="hidden"
                        value={currentUserDepartmentName}
                        onChange={() => setDepartmentName(currentUserDepartmentName)}
                      />
                    )}
                  </div>
                )}
              </div>
              
              <button
                onClick={async () => {
                  const deptToUse = isSuperAdmin ? departmentName : currentUserDepartmentName;
                  if (!deptToUse) {
                    alert(isSuperAdmin ? "Please select a department" : "No department assigned");
                    return;
                  }
                  const deptHash = ethers.keccak256(ethers.toUtf8Bytes(deptToUse));
                  const payrollHandle = await payrollDapp.getDepartmentEncryptedPayroll(deptHash);
                  if (payrollHandle) {
                    setDepartmentPayrollHandle(payrollHandle);
                    setDecryptedDepartmentPayroll(null);
                  }
                }}
                disabled={payrollDapp.isLoading || (!isSuperAdmin && !currentUserDepartmentName) || (isSuperAdmin && !departmentName)}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                {payrollDapp.isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Querying...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>Query Department Payroll</span>
                  </>
                )}
              </button>
              
              {departmentPayrollHandle && (
                <div className="mt-6 space-y-4 animate-fadeIn">
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Encrypted Payroll Handle
                    </h3>
                    <p className="text-xs font-mono text-gray-600 break-all bg-white p-3 rounded border border-gray-200">{departmentPayrollHandle}</p>
                  </div>
                  
                  <button
                    onClick={async () => {
                      if (!departmentPayrollHandle) return;
                      const decrypted = await payrollDapp.decryptSalary(departmentPayrollHandle);
                      if (decrypted !== null) {
                        setDecryptedDepartmentPayroll(String(decrypted));
                      }
                    }}
                    disabled={payrollDapp.isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {payrollDapp.isLoading ? (
                      <>
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Decrypting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        <span>Decrypt Department Payroll</span>
                      </>
                    )}
                  </button>
                  
                  {decryptedDepartmentPayroll !== null && (
                    <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl animate-fadeIn">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-green-200 rounded-full flex items-center justify-center">
                          <IconCheck />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-green-800 mb-1">Decryption Successful</p>
                          <p className="text-xs text-green-700 mb-3">Total Department Payroll</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold text-green-900">${decryptedDepartmentPayroll}</span>
                            <span className="text-sm text-green-700">USD/month</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
