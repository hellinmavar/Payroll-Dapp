import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedPayrollDapp = await deploy("PayrollDapp", {
    from: deployer,
    log: true,
    waitConfirmations: 1,
  });

  console.log(`PayrollDapp contract: `, deployedPayrollDapp.address);
};
export default func;
func.id = "deploy_payrollDapp"; // id required to prevent reexecution
func.tags = ["PayrollDapp"];

