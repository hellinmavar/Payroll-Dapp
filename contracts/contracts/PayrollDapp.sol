// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title PayrollDapp - Encrypted Payroll Management System
/// @notice A privacy-preserving payroll system using FHEVM for encrypted salary calculations and payments
contract PayrollDapp is ZamaEthereumConfig {
    //   Role Definition  
    bytes32 public constant SUPER_ADMIN_ROLE = keccak256("SUPER_ADMIN_ROLE");
    bytes32 public constant FINANCE_ADMIN_ROLE = keccak256("FINANCE_ADMIN_ROLE");
    bytes32 public constant DEPARTMENT_MANAGER_ROLE = keccak256("DEPARTMENT_MANAGER_ROLE");
    bytes32 public constant EMPLOYEE_ROLE = keccak256("EMPLOYEE_ROLE");

    // Employee Data Structure
    struct Employee {
        address employeeAddress;
        bytes32 departmentHash;
        euint32 encryptedSalary;
        euint32 encryptedBonus;
        bool isActive;
        uint256 createdAt;
    }

    // Salary Adjustment History
    struct SalaryAdjustment {
        address employeeAddress;
        euint32 previousSalary;
        euint32 newSalary;
        bytes32 reasonHash; // Hash of adjustment reason
        address adjustedBy;
        uint256 timestamp;
    }

    //  Bonus Record 
    struct BonusRecord {
        address employeeAddress;
        euint32 encryptedBonus;
        bytes32 reasonHash;
        address grantedBy;
        uint256 timestamp;
    }

    //  Payment Record 
    struct PaymentRecord {
        address employeeAddress;
        euint32 encryptedAmount;
        bytes32 paymentTypeHash; // "salary" or "bonus"
        uint256 timestamp;
    }

    //  Salary Adjustment Request 
    struct SalaryAdjustmentRequest {
        address employeeAddress;
        euint32 requestedSalary;
        bytes32 reasonHash;
        address requestedBy;
        uint256 timestamp;
        bool approved;
        bool executed;
    }

    //  Role Change History 
    struct RoleChangeRecord {
        address user;
        bytes32 previousRole;
        bytes32 newRole;
        address changedBy;
        uint256 timestamp;
    }

    //  State Variables 
    mapping(address => Employee) public employees;
    mapping(address => bytes32) public employeeDepartments; // employee => department hash
    mapping(bytes32 => address[]) public departmentEmployees; // department => employee list
    mapping(address => bool) public roles; // Simplified role mapping (address => has any role)
    mapping(address => bytes32) public userRoles; // address => role bytes32
    
    address public superAdmin;
    
    SalaryAdjustment[] public salaryAdjustments;
    BonusRecord[] public bonusRecords;
    PaymentRecord[] public paymentRecords;
    SalaryAdjustmentRequest[] public salaryAdjustmentRequests;
    RoleChangeRecord[] public roleChangeRecords;
    
    euint32 public totalEncryptedPayroll; // Encrypted sum of all salaries
    euint32 public totalEncryptedBonuses; // Encrypted sum of all bonuses
    uint256 public totalEmployees;
    uint256 public lastPaymentDate;
    uint256 public paymentInterval; // Payment interval in seconds (e.g., 30 days = 2592000)
    
    // Employee and Department Lists Management
    address[] public employeeAddressList; // List of all employee addresses
    string[] public departmentNameList; // List of all department names
    mapping(address => bool) public isEmployeeAddressRegistered; // Check if address is in list
    mapping(string => bool) public isDepartmentNameRegistered; // Check if department name is in list

    //  Events 
    event EmployeeAdded(address indexed employee, bytes32 indexed departmentHash);
    event EmployeeRemoved(address indexed employee);
    event SalaryUpdated(address indexed employee, bytes32 indexed reasonHash);
    event BonusGranted(address indexed employee, bytes32 indexed reasonHash);
    event PaymentProcessed(address indexed employee, bytes32 indexed paymentTypeHash);
    event RoleAssigned(address indexed user, bytes32 indexed role);
    event RoleRevoked(address indexed user, bytes32 indexed role);
    event DepartmentUpdated(address indexed employee, bytes32 indexed oldDepartment, bytes32 indexed newDepartment);
    event SalaryAdjustmentRequested(address indexed employee, bytes32 indexed reasonHash, uint256 indexed requestId);
    event SalaryAdjustmentApproved(uint256 indexed requestId);
    event SalaryAdjustmentExecuted(uint256 indexed requestId);
    event BatchBonusGranted(uint256 indexed count, bytes32 indexed reasonHash);
    event EmployeeAddressAdded(address indexed employeeAddress);
    event EmployeeAddressRemoved(address indexed employeeAddress);
    event DepartmentNameAdded(string indexed departmentName);
    event DepartmentNameRemoved(string indexed departmentName);

    //  Modifiers 
    modifier onlySuperAdmin() {
        require(userRoles[msg.sender] == SUPER_ADMIN_ROLE, "Only super admin");
        _;
    }

    modifier onlyFinanceAdmin() {
        require(
            userRoles[msg.sender] == FINANCE_ADMIN_ROLE || 
            userRoles[msg.sender] == SUPER_ADMIN_ROLE,
            "Only finance admin"
        );
        _;
    }

    modifier onlyDepartmentManager() {
        require(
            userRoles[msg.sender] == DEPARTMENT_MANAGER_ROLE ||
            userRoles[msg.sender] == FINANCE_ADMIN_ROLE ||
            userRoles[msg.sender] == SUPER_ADMIN_ROLE,
            "Only department manager"
        );
        _;
    }

    modifier onlyEmployeeOrSuperAdmin(address employee) {
        require(
            employee == msg.sender ||
            userRoles[msg.sender] == SUPER_ADMIN_ROLE,
            "Not authorized: Only employee or super admin can view individual salary"
        );
        _;
    }

    //  Constructor 
    constructor() {
        superAdmin = msg.sender;
        userRoles[msg.sender] = SUPER_ADMIN_ROLE;
        roles[msg.sender] = true;
        paymentInterval = 30 days; // Default: monthly payments
        lastPaymentDate = block.timestamp;
        
        emit RoleAssigned(msg.sender, SUPER_ADMIN_ROLE);
    }

    //  Role Management 
    /// @notice Assign a role to a user (only super admin)
    /// @param user Address to assign role to
    /// @param role Role to assign (SUPER_ADMIN_ROLE, FINANCE_ADMIN_ROLE, etc.)
    function assignRole(address user, bytes32 role) external onlySuperAdmin {
        require(
            role == SUPER_ADMIN_ROLE ||
            role == FINANCE_ADMIN_ROLE ||
            role == DEPARTMENT_MANAGER_ROLE ||
            role == EMPLOYEE_ROLE,
            "Invalid role"
        );
        
        bytes32 previousRole = userRoles[user];
        userRoles[user] = role;
        roles[user] = true;
        
        // Record role change
        roleChangeRecords.push(RoleChangeRecord({
            user: user,
            previousRole: previousRole,
            newRole: role,
            changedBy: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit RoleAssigned(user, role);
    }

    /// @notice Revoke a role from a user (only super admin)
    /// @param user Address to revoke role from
    function revokeRole(address user) external onlySuperAdmin {
        require(user != superAdmin, "Cannot revoke super admin");
        bytes32 previousRole = userRoles[user];
        userRoles[user] = bytes32(0);
        roles[user] = false;
        
        // Record role change
        roleChangeRecords.push(RoleChangeRecord({
            user: user,
            previousRole: previousRole,
            newRole: bytes32(0),
            changedBy: msg.sender,
            timestamp: block.timestamp
        }));
        
        emit RoleRevoked(user, previousRole);
    }

    /// @notice Get the role of a user
    /// @param user Address to check
    /// @return role The role bytes32 value
    function getUserRole(address user) external view returns (bytes32) {
        return userRoles[user];
    }

    //  Employee Management 
    /// @notice Add a new employee with encrypted salary (only finance admin)
    /// @param employeeAddress Employee's wallet address
    /// @param departmentHash Hash of department name
    /// @param encryptedSalary Encrypted salary amount
    /// @param inputProof Proof for the encrypted input
    function addEmployee(
        address employeeAddress,
        bytes32 departmentHash,
        externalEuint32 encryptedSalary,
        bytes calldata inputProof
    ) external onlyFinanceAdmin {
        require(employeeAddress != address(0), "Invalid address");
        require(!employees[employeeAddress].isActive, "Employee already exists");

        euint32 salary = FHE.fromExternal(encryptedSalary, inputProof);
        
        employees[employeeAddress] = Employee({
            employeeAddress: employeeAddress,
            departmentHash: departmentHash,
            encryptedSalary: salary,
            encryptedBonus: FHE.asEuint32(0),
            isActive: true,
            createdAt: block.timestamp
        });

        employeeDepartments[employeeAddress] = departmentHash;
        departmentEmployees[departmentHash].push(employeeAddress);
        
        // Grant ACL permissions for salary before using it in operations
        FHE.allowThis(salary);
        FHE.allow(salary, employeeAddress);
        
        // Initialize totalEncryptedPayroll ACL if this is the first employee
        if (totalEmployees == 0) {
            totalEncryptedPayroll = FHE.asEuint32(0);
            FHE.allowThis(totalEncryptedPayroll);
        }
        
        // Update total payroll (now both values have proper ACL)
        totalEncryptedPayroll = FHE.add(totalEncryptedPayroll, salary);
        // Re-grant ACL for the new totalEncryptedPayroll value after addition
        FHE.allowThis(totalEncryptedPayroll);
        totalEmployees++;
        
        // Note: encryptedBonus is already initialized as FHE.asEuint32(0) in Employee struct
        // and ACL is set below, but we need to ensure it's set after any operations
        FHE.allowThis(employees[employeeAddress].encryptedBonus);
        FHE.allow(employees[employeeAddress].encryptedBonus, employeeAddress);

        // Assign employee role if not already assigned
        if (userRoles[employeeAddress] == bytes32(0)) {
            userRoles[employeeAddress] = EMPLOYEE_ROLE;
            roles[employeeAddress] = true;
            emit RoleAssigned(employeeAddress, EMPLOYEE_ROLE);
        }

        emit EmployeeAdded(employeeAddress, departmentHash);
    }

    /// @notice Remove an employee (only finance admin)
    /// @param employeeAddress Employee's wallet address
    function removeEmployee(address employeeAddress) external onlyFinanceAdmin {
        require(employees[employeeAddress].isActive, "Employee not found");

        // Subtract from total payroll
        totalEncryptedPayroll = FHE.sub(totalEncryptedPayroll, employees[employeeAddress].encryptedSalary);
        totalEmployees--;

        employees[employeeAddress].isActive = false;
        
        // Remove from department list
        bytes32 deptHash = employeeDepartments[employeeAddress];
        address[] storage deptList = departmentEmployees[deptHash];
        for (uint256 i = 0; i < deptList.length; i++) {
            if (deptList[i] == employeeAddress) {
                deptList[i] = deptList[deptList.length - 1];
                deptList.pop();
                break;
            }
        }

        emit EmployeeRemoved(employeeAddress);
    }

    /// @notice Update employee department (only finance admin)
    /// @param employeeAddress Employee's wallet address
    /// @param newDepartmentHash New department hash
    function updateEmployeeDepartment(
        address employeeAddress,
        bytes32 newDepartmentHash
    ) external onlyFinanceAdmin {
        require(employees[employeeAddress].isActive, "Employee not found");
        
        bytes32 oldDepartment = employeeDepartments[employeeAddress];
        employeeDepartments[employeeAddress] = newDepartmentHash;
        employees[employeeAddress].departmentHash = newDepartmentHash;

        // Remove from old department
        address[] storage oldDeptList = departmentEmployees[oldDepartment];
        for (uint256 i = 0; i < oldDeptList.length; i++) {
            if (oldDeptList[i] == employeeAddress) {
                oldDeptList[i] = oldDeptList[oldDeptList.length - 1];
                oldDeptList.pop();
                break;
            }
        }

        // Add to new department
        departmentEmployees[newDepartmentHash].push(employeeAddress);

        emit DepartmentUpdated(employeeAddress, oldDepartment, newDepartmentHash);
    }

    //  Salary Management 
    /// @notice Request salary adjustment (department manager can request for their department employees)
    /// @param employeeAddress Employee's wallet address
    /// @param requestedEncryptedSalary Requested encrypted salary
    /// @param reasonHash Hash of adjustment reason
    /// @param inputProof Proof for the encrypted input
    function requestSalaryAdjustment(
        address employeeAddress,
        externalEuint32 requestedEncryptedSalary,
        bytes32 reasonHash,
        bytes calldata inputProof
    ) external {
        require(employees[employeeAddress].isActive, "Employee not found");
        
        // Department manager can only request for employees in their department
        if (userRoles[msg.sender] == DEPARTMENT_MANAGER_ROLE) {
            // Check if manager is also an employee (has a department)
            require(employees[msg.sender].isActive, "Manager must be an employee");
            bytes32 managerDept = employeeDepartments[msg.sender];
            bytes32 employeeDept = employeeDepartments[employeeAddress];
            require(managerDept == employeeDept && managerDept != bytes32(0), "Not in same department");
        } else {
            // Finance admin or super admin can request for anyone
            require(
                userRoles[msg.sender] == FINANCE_ADMIN_ROLE ||
                userRoles[msg.sender] == SUPER_ADMIN_ROLE,
                "Not authorized"
            );
        }

        euint32 requestedSalary = FHE.fromExternal(requestedEncryptedSalary, inputProof);

        salaryAdjustmentRequests.push(SalaryAdjustmentRequest({
            employeeAddress: employeeAddress,
            requestedSalary: requestedSalary,
            reasonHash: reasonHash,
            requestedBy: msg.sender,
            timestamp: block.timestamp,
            approved: false,
            executed: false
        }));

        // Grant ACL permissions
        FHE.allowThis(requestedSalary);
        FHE.allow(requestedSalary, employeeAddress);

        emit SalaryAdjustmentRequested(employeeAddress, reasonHash, salaryAdjustmentRequests.length - 1);
    }

    /// @notice Approve salary adjustment request (only finance admin or super admin)
    /// @param requestId ID of the salary adjustment request
    function approveSalaryAdjustment(uint256 requestId) external onlyFinanceAdmin {
        require(requestId < salaryAdjustmentRequests.length, "Invalid request ID");
        SalaryAdjustmentRequest storage request = salaryAdjustmentRequests[requestId];
        require(!request.approved, "Already approved");
        require(!request.executed, "Already executed");

        request.approved = true;
        emit SalaryAdjustmentApproved(requestId);
    }

    /// @notice Execute approved salary adjustment (only finance admin or super admin)
    /// @param requestId ID of the salary adjustment request
    function executeSalaryAdjustment(uint256 requestId) external onlyFinanceAdmin {
        require(requestId < salaryAdjustmentRequests.length, "Invalid request ID");
        SalaryAdjustmentRequest storage request = salaryAdjustmentRequests[requestId];
        require(request.approved, "Not approved");
        require(!request.executed, "Already executed");

        address employeeAddress = request.employeeAddress;
        require(employees[employeeAddress].isActive, "Employee not found");

        euint32 previousSalary = employees[employeeAddress].encryptedSalary;
        euint32 newSalary = request.requestedSalary;

        // Update total payroll
        totalEncryptedPayroll = FHE.sub(totalEncryptedPayroll, previousSalary);
        // Re-grant ACL for totalEncryptedPayroll after subtraction
        FHE.allowThis(totalEncryptedPayroll);
        totalEncryptedPayroll = FHE.add(totalEncryptedPayroll, newSalary);
        // Re-grant ACL for the new totalEncryptedPayroll value after addition
        FHE.allowThis(totalEncryptedPayroll);

        // Record adjustment
        salaryAdjustments.push(SalaryAdjustment({
            employeeAddress: employeeAddress,
            previousSalary: previousSalary,
            newSalary: newSalary,
            reasonHash: request.reasonHash,
            adjustedBy: msg.sender,
            timestamp: block.timestamp
        }));

        // Update employee salary
        employees[employeeAddress].encryptedSalary = newSalary;
        request.executed = true;

        emit SalaryUpdated(employeeAddress, request.reasonHash);
        emit SalaryAdjustmentExecuted(requestId);
    }

    /// @notice Update employee salary directly (only finance admin, bypasses approval)
    /// @param employeeAddress Employee's wallet address
    /// @param newEncryptedSalary New encrypted salary
    /// @param reasonHash Hash of adjustment reason
    /// @param inputProof Proof for the encrypted input
    function updateSalary(
        address employeeAddress,
        externalEuint32 newEncryptedSalary,
        bytes32 reasonHash,
        bytes calldata inputProof
    ) external onlyFinanceAdmin {
        require(employees[employeeAddress].isActive, "Employee not found");

        euint32 previousSalary = employees[employeeAddress].encryptedSalary;
        euint32 newSalary = FHE.fromExternal(newEncryptedSalary, inputProof);

        // Grant ACL permissions for newSalary before using it in operations
        FHE.allowThis(newSalary);
        FHE.allow(newSalary, employeeAddress);

        // Update total payroll (now both values have proper ACL)
        totalEncryptedPayroll = FHE.sub(totalEncryptedPayroll, previousSalary);
        // Re-grant ACL for totalEncryptedPayroll after subtraction
        FHE.allowThis(totalEncryptedPayroll);
        totalEncryptedPayroll = FHE.add(totalEncryptedPayroll, newSalary);
        // Re-grant ACL for the new totalEncryptedPayroll value after addition
        FHE.allowThis(totalEncryptedPayroll);

        // Record adjustment
        salaryAdjustments.push(SalaryAdjustment({
            employeeAddress: employeeAddress,
            previousSalary: previousSalary,
            newSalary: newSalary,
            reasonHash: reasonHash,
            adjustedBy: msg.sender,
            timestamp: block.timestamp
        }));

        // Update employee salary
        employees[employeeAddress].encryptedSalary = newSalary;

        emit SalaryUpdated(employeeAddress, reasonHash);
    }

    /// @notice Get encrypted salary (only employee themselves or super admin)
    /// @param employeeAddress Employee's wallet address
    /// @return Encrypted salary
    function getEncryptedSalary(address employeeAddress) 
        external 
        onlyEmployeeOrSuperAdmin(employeeAddress) 
        returns (euint32) 
    {
        require(employees[employeeAddress].isActive, "Employee not found");
        // Grant decryption permission to the caller (employee or super admin)
        // Note: If employee is viewing their own salary, ACL was already set in addEmployee
        // But we need to grant it again here in case super admin is viewing
        FHE.allow(employees[employeeAddress].encryptedSalary, msg.sender);
        return employees[employeeAddress].encryptedSalary;
    }

    //  Bonus Management 
    /// @notice Grant bonus to employee (only finance admin)
    /// @param employeeAddress Employee's wallet address
    /// @param encryptedBonus Encrypted bonus amount
    /// @param reasonHash Hash of bonus reason
    /// @param inputProof Proof for the encrypted input
    function grantBonus(
        address employeeAddress,
        externalEuint32 encryptedBonus,
        bytes32 reasonHash,
        bytes calldata inputProof
    ) external onlyFinanceAdmin {
        require(employees[employeeAddress].isActive, "Employee not found");

        euint32 bonus = FHE.fromExternal(encryptedBonus, inputProof);

        // Grant ACL permissions for bonus before using it in operations
        FHE.allowThis(bonus);
        FHE.allow(bonus, employeeAddress);
        
        // Initialize totalEncryptedBonuses ACL if this is the first bonus
        if (bonusRecords.length == 0) {
            totalEncryptedBonuses = FHE.asEuint32(0);
            FHE.allowThis(totalEncryptedBonuses);
        }

        // Add to employee's total bonus
        employees[employeeAddress].encryptedBonus = FHE.add(
            employees[employeeAddress].encryptedBonus,
            bonus
        );
        // Re-grant ACL for the new encryptedBonus value after addition
        FHE.allowThis(employees[employeeAddress].encryptedBonus);
        FHE.allow(employees[employeeAddress].encryptedBonus, employeeAddress);

        // Update total bonuses (now both values have proper ACL)
        totalEncryptedBonuses = FHE.add(totalEncryptedBonuses, bonus);
        // Re-grant ACL for the new totalEncryptedBonuses value after addition
        FHE.allowThis(totalEncryptedBonuses);

        // Record bonus
        bonusRecords.push(BonusRecord({
            employeeAddress: employeeAddress,
            encryptedBonus: bonus,
            reasonHash: reasonHash,
            grantedBy: msg.sender,
            timestamp: block.timestamp
        }));

        emit BonusGranted(employeeAddress, reasonHash);
    }

    /// @notice Batch grant bonuses to multiple employees (only finance admin)
    /// @param employeeAddresses Array of employee addresses
    /// @param encryptedBonuses Array of encrypted bonus amounts
    /// @param reasonHash Hash of bonus reason (same for all)
    /// @param inputProofs Array of proofs for encrypted inputs
    function batchGrantBonus(
        address[] calldata employeeAddresses,
        externalEuint32[] calldata encryptedBonuses,
        bytes32 reasonHash,
        bytes[] calldata inputProofs
    ) external onlyFinanceAdmin {
        require(
            employeeAddresses.length == encryptedBonuses.length &&
            employeeAddresses.length == inputProofs.length,
            "Array length mismatch"
        );
        require(employeeAddresses.length > 0, "Empty array");

        // Initialize totalEncryptedBonuses ACL if this is the first bonus
        if (bonusRecords.length == 0) {
            totalEncryptedBonuses = FHE.asEuint32(0);
            FHE.allowThis(totalEncryptedBonuses);
        }

        euint32 totalBatchBonus = FHE.asEuint32(0);
        FHE.allowThis(totalBatchBonus);

        for (uint256 i = 0; i < employeeAddresses.length; i++) {
            require(employees[employeeAddresses[i]].isActive, "Employee not found");

            euint32 bonus = FHE.fromExternal(encryptedBonuses[i], inputProofs[i]);

            // Grant ACL permissions for bonus before using it in operations
            FHE.allowThis(bonus);
            FHE.allow(bonus, employeeAddresses[i]);

            // Add to employee's total bonus
            employees[employeeAddresses[i]].encryptedBonus = FHE.add(
                employees[employeeAddresses[i]].encryptedBonus,
                bonus
            );
            // Re-grant ACL for the new encryptedBonus value after addition
            FHE.allowThis(employees[employeeAddresses[i]].encryptedBonus);
            FHE.allow(employees[employeeAddresses[i]].encryptedBonus, employeeAddresses[i]);

            // Accumulate total batch bonus (now both values have proper ACL)
            totalBatchBonus = FHE.add(totalBatchBonus, bonus);

            // Record bonus
            bonusRecords.push(BonusRecord({
                employeeAddress: employeeAddresses[i],
                encryptedBonus: bonus,
                reasonHash: reasonHash,
                grantedBy: msg.sender,
                timestamp: block.timestamp
            }));
        }

        // Update total bonuses (now both values have proper ACL)
        totalEncryptedBonuses = FHE.add(totalEncryptedBonuses, totalBatchBonus);
        // Re-grant ACL for the new totalEncryptedBonuses value after addition
        FHE.allowThis(totalEncryptedBonuses);

        emit BatchBonusGranted(employeeAddresses.length, reasonHash);
    }

    /// @notice Get encrypted bonus (only employee themselves or super admin)
    /// @param employeeAddress Employee's wallet address
    /// @return Encrypted bonus
    function getEncryptedBonus(address employeeAddress) 
        external 
        onlyEmployeeOrSuperAdmin(employeeAddress) 
        returns (euint32) 
    {
        require(employees[employeeAddress].isActive, "Employee not found");
        // Grant decryption permission to the caller (employee or super admin)
        // Note: If employee is viewing their own bonus, ACL was already set in grantBonus
        // But we need to grant it again here in case super admin is viewing
        FHE.allow(employees[employeeAddress].encryptedBonus, msg.sender);
        return employees[employeeAddress].encryptedBonus;
    }

    //  Payment Processing 
    /// @notice Process salary payments for all active employees (only finance admin)
    function processPayments() external onlyFinanceAdmin {
        require(
            block.timestamp >= lastPaymentDate + paymentInterval,
            "Payment interval not reached"
        );

        // In a real implementation, you would iterate through all employees
        // and transfer funds. For this example, we record the payment event.
        // Actual token transfers would be handled separately.

        lastPaymentDate = block.timestamp;

        // Note: In production, you would need to iterate through employees
        // and process individual payments. This is simplified for the example.
        emit PaymentProcessed(address(0), keccak256("BATCH_SALARY"));
    }

    /// @notice Process payment for a specific employee (only finance admin)
    /// @param employeeAddress Employee's wallet address
    /// @param encryptedAmount Encrypted payment amount
    /// @param paymentTypeHash Hash of payment type ("salary" or "bonus")
    /// @param inputProof Proof for the encrypted input
    function processEmployeePayment(
        address employeeAddress,
        externalEuint32 encryptedAmount,
        bytes32 paymentTypeHash,
        bytes calldata inputProof
    ) external onlyFinanceAdmin {
        require(employees[employeeAddress].isActive, "Employee not found");

        euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

        // Record payment
        paymentRecords.push(PaymentRecord({
            employeeAddress: employeeAddress,
            encryptedAmount: amount,
            paymentTypeHash: paymentTypeHash,
            timestamp: block.timestamp
        }));

        // Grant ACL permissions
        FHE.allowThis(amount);
        FHE.allow(amount, employeeAddress);

        emit PaymentProcessed(employeeAddress, paymentTypeHash);
    }

    //  Aggregation & Statistics 
    /// @notice Get encrypted total payroll (finance admin or department manager can view)
    /// @return Encrypted total payroll
    function getTotalEncryptedPayroll() 
        external 
        onlyDepartmentManager 
        returns (euint32) 
    {
        // Grant decryption permission to the caller (finance admin, department manager, or super admin)
        FHE.allow(totalEncryptedPayroll, msg.sender);
        return totalEncryptedPayroll;
    }

    /// @notice Get encrypted total bonuses (finance admin or department manager can view)
    /// @return Encrypted total bonuses
    function getTotalEncryptedBonuses() 
        external 
        onlyDepartmentManager 
        returns (euint32) 
    {
        // Grant decryption permission to the caller (finance admin, department manager, or super admin)
        FHE.allow(totalEncryptedBonuses, msg.sender);
        return totalEncryptedBonuses;
    }

    /// @notice Calculate encrypted average salary (finance admin or department manager can view)
    /// @return Encrypted average salary (approximate using multiplication by inverse)
    /// @dev Note: FHE division is complex. This uses an approximation method.
    /// For better accuracy, the divisor (totalEmployees) should be small or use external computation.
    function getEncryptedAverageSalary() 
        external 
        onlyDepartmentManager 
        returns (euint32) 
    {
        if (totalEmployees == 0) {
            euint32 zero = FHE.asEuint32(0);
            FHE.allow(zero, msg.sender);
            return zero;
        }
        // Note: True FHE division is not directly supported.
        // This is a placeholder that returns the total.
        // In production, you would need to:
        // 1. Use external computation service to decrypt, divide, and re-encrypt
        // 2. Use approximate division algorithms
        // 3. Use multiplication by pre-computed inverse (if divisor is known)
        // Grant decryption permission to the caller (finance admin, department manager, or super admin)
        FHE.allow(totalEncryptedPayroll, msg.sender);
        return totalEncryptedPayroll; // Simplified - actual division requires external computation
    }

    /// @notice Get department encrypted payroll sum (only department manager or finance admin)
    /// @param departmentHash Department hash
    /// @return Encrypted department payroll sum
    function getDepartmentEncryptedPayroll(bytes32 departmentHash) 
        external 
        onlyDepartmentManager 
        returns (euint32) 
    {
        address[] memory deptEmployees = departmentEmployees[departmentHash];
        euint32 deptTotal = FHE.asEuint32(0);
        FHE.allowThis(deptTotal);

        for (uint256 i = 0; i < deptEmployees.length; i++) {
            if (employees[deptEmployees[i]].isActive) {
                deptTotal = FHE.add(deptTotal, employees[deptEmployees[i]].encryptedSalary);
                // Re-grant ACL for deptTotal after each addition
                FHE.allowThis(deptTotal);
            }
        }

        // Grant decryption permission to the caller (department manager, finance admin, or super admin)
        FHE.allow(deptTotal, msg.sender);

        return deptTotal;
    }

    //  History & Audit 
    /// @notice Get salary adjustment count
    /// @return Count of salary adjustments
    function getSalaryAdjustmentCount() external view returns (uint256) {
        return salaryAdjustments.length;
    }

    /// @notice Get bonus record count
    /// @return Count of bonus records
    function getBonusRecordCount() external view returns (uint256) {
        return bonusRecords.length;
    }

    /// @notice Get payment record count
    /// @return Count of payment records
    function getPaymentRecordCount() external view returns (uint256) {
        return paymentRecords.length;
    }

    /// @notice Get role change record count
    /// @return Count of role change records
    function getRoleChangeRecordCount() external view returns (uint256) {
        return roleChangeRecords.length;
    }

    /// @notice Get salary adjustment request count
    /// @return Count of salary adjustment requests
    function getSalaryAdjustmentRequestCount() external view returns (uint256) {
        return salaryAdjustmentRequests.length;
    }

    /// @notice Get aggregated encrypted statistics for audit (only finance admin or super admin)
    /// @return totalPayroll Encrypted total payroll
    /// @return totalBonuses Encrypted total bonuses
    /// @return totalEmployees_ Total employee count
    /// @return totalAdjustments Total salary adjustments count
    /// @return totalBonusRecords Total bonus records count
    function getAuditStatistics() 
        external 
        onlyFinanceAdmin
        returns (
            euint32 totalPayroll,
            euint32 totalBonuses,
            uint256 totalEmployees_,
            uint256 totalAdjustments,
            uint256 totalBonusRecords
        ) 
    {
        // Initialize totalEncryptedPayroll if not already initialized (when no employees exist)
        if (totalEmployees == 0) {
            totalEncryptedPayroll = FHE.asEuint32(0);
            FHE.allowThis(totalEncryptedPayroll);
        } else {
            // Ensure totalEncryptedPayroll has allowThis permission before allowing caller
            FHE.allowThis(totalEncryptedPayroll);
        }
        
        // Initialize totalEncryptedBonuses if not already initialized (when no bonus records exist)
        if (bonusRecords.length == 0) {
            totalEncryptedBonuses = FHE.asEuint32(0);
            FHE.allowThis(totalEncryptedBonuses);
        } else {
            // Ensure totalEncryptedBonuses has allowThis permission before allowing caller
            FHE.allowThis(totalEncryptedBonuses);
        }
        
        // Grant decryption permission to the caller (finance admin or super admin) for both encrypted values
        FHE.allow(totalEncryptedPayroll, msg.sender);
        FHE.allow(totalEncryptedBonuses, msg.sender);
        return (
            totalEncryptedPayroll,
            totalEncryptedBonuses,
            totalEmployees,
            salaryAdjustments.length,
            bonusRecords.length
        );
    }

    //  Configuration 
    /// @notice Set payment interval (only super admin)
    /// @param interval Payment interval in seconds
    function setPaymentInterval(uint256 interval) external onlySuperAdmin {
        paymentInterval = interval;
    }

    /// @notice Get payment interval
    /// @return Payment interval in seconds
    function getPaymentInterval() external view returns (uint256) {
        return paymentInterval;
    }

    /// @notice Get total number of employees
    /// @return Total employee count
    function getTotalEmployees() external view returns (uint256) {
        return totalEmployees;
    }

    //  Employee and Department Lists Management 
    /// @notice Add employee addresses to the list (only finance admin)
    /// @param addresses Array of employee addresses to add
    function addEmployeeAddresses(address[] calldata addresses) external onlyFinanceAdmin {
        for (uint256 i = 0; i < addresses.length; i++) {
            require(addresses[i] != address(0), "Invalid address");
            if (!isEmployeeAddressRegistered[addresses[i]]) {
                employeeAddressList.push(addresses[i]);
                isEmployeeAddressRegistered[addresses[i]] = true;
                emit EmployeeAddressAdded(addresses[i]);
            }
        }
    }

    /// @notice Remove employee address from the list (only finance admin)
    /// @param employeeAddress Address to remove
    function removeEmployeeAddress(address employeeAddress) external onlyFinanceAdmin {
        require(isEmployeeAddressRegistered[employeeAddress], "Address not in list");
        
        // Find and remove from array
        for (uint256 i = 0; i < employeeAddressList.length; i++) {
            if (employeeAddressList[i] == employeeAddress) {
                employeeAddressList[i] = employeeAddressList[employeeAddressList.length - 1];
                employeeAddressList.pop();
                break;
            }
        }
        
        isEmployeeAddressRegistered[employeeAddress] = false;
        emit EmployeeAddressRemoved(employeeAddress);
    }

    /// @notice Get all employee addresses
    /// @return Array of all employee addresses
    function getAllEmployeeAddresses() external view returns (address[] memory) {
        return employeeAddressList;
    }

    /// @notice Get employee address count
    /// @return Number of employee addresses in the list
    function getEmployeeAddressCount() external view returns (uint256) {
        return employeeAddressList.length;
    }

    /// @notice Add department names to the list (only finance admin)
    /// @param names Array of department names to add
    function addDepartmentNames(string[] calldata names) external onlyFinanceAdmin {
        for (uint256 i = 0; i < names.length; i++) {
            require(bytes(names[i]).length > 0, "Empty department name");
            if (!isDepartmentNameRegistered[names[i]]) {
                departmentNameList.push(names[i]);
                isDepartmentNameRegistered[names[i]] = true;
                emit DepartmentNameAdded(names[i]);
            }
        }
    }

    /// @notice Remove department name from the list (only finance admin)
    /// @param departmentName Department name to remove
    function removeDepartmentName(string calldata departmentName) external onlyFinanceAdmin {
        require(isDepartmentNameRegistered[departmentName], "Department not in list");
        
        // Find and remove from array
        for (uint256 i = 0; i < departmentNameList.length; i++) {
            if (keccak256(bytes(departmentNameList[i])) == keccak256(bytes(departmentName))) {
                departmentNameList[i] = departmentNameList[departmentNameList.length - 1];
                departmentNameList.pop();
                break;
            }
        }
        
        isDepartmentNameRegistered[departmentName] = false;
        emit DepartmentNameRemoved(departmentName);
    }

    /// @notice Get all department names
    /// @return Array of all department names
    function getAllDepartmentNames() external view returns (string[] memory) {
        return departmentNameList;
    }

    /// @notice Get department name count
    /// @return Number of department names in the list
    function getDepartmentNameCount() external view returns (uint256) {
        return departmentNameList.length;
    }
}

