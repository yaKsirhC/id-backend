import { IUser } from '@interfaces/user.interface.js'
import { UserModel } from '@schemas/user.schema.js'
import { Browser, Page } from 'puppeteer'
import puppeteer from 'puppeteer-extra'
import stealth from 'puppeteer-extra-plugin-stealth'
import agent from 'user-agents'
import { handleUserStoppedStreaming } from './socket.utils.js'

puppeteer.use(stealth())

const browsers = new Map<string, {
    username: string,
    timestamp: number,
    browser: any
}>()

const extensionPath = '/root/extension'

const launchBrowser = async (
    userId: string,
    username: string,
    password: string,
): Promise<{ success: boolean }> => {

    try {

        const exists = browsers.get(userId)
        if (!exists) {

            const browser = await puppeteer.launch({
                headless: false,
                args: [
                    `--disable-extensions-except=${extensionPath}`,
                    `--load-extension=${extensionPath}`,
                    `--no-sandbox`,
                    '--disable-features=IsolateOrigins',
                    '--disable-web-security',
                ],
                executablePath: '/usr/bin/google-chrome-stable',
                defaultViewport: {
                    width: 1400,
                    height: 800,
                    isMobile: false
                },
                env: {
                    DISPLAY: ':99'
                }
            })

            const page = await browser.newPage()
            await page.setBypassCSP(true)

            const userAgent = new agent({ deviceCategory: 'desktop' }).toString()

            await page.setUserAgent(userAgent)
            await page.setRequestInterception(true)

            const responseListener = async (response: any) => {
                const url = response.url();
                const status = response.status();

                if (url === 'https://chaturbate.com/auth/login/' && status === 302) {
                    await page.goto(`https://chaturbate.com/b/${String(username).toLowerCase()}/?useExternalSoftware=true`);
                    page.off('response', responseListener);
                }
            }

            page.on('request', (request: any) => {
                request.continue()
            })

            page.on('response', responseListener)

            await page.goto('https://chaturbate.com/auth/login')

            await new Promise((r) => setTimeout(r, 2000))

            const userInput: any = await page.$('#id_username');
            await userInput.type(username, { delay: 200 });

            await new Promise((r) => setTimeout(r, 1250));

            const passInput: any = await page.$('#id_password');
            await passInput.type(password, { delay: 180 });

            const btn: any = await page.$('input[type="submit"]');
            await new Promise((r) => setTimeout(r, 1250));
            await btn.click();

            browsers.set(userId, {
                username,
                timestamp: Math.floor(Date.now() / 1000),
                browser
            })

            return {
                success: true
            }

        } else {
            return {
                success: true
            }
        }

    } catch (err) {

        return {
            success: false
        }

    }

}

const updateTimestamp = (userId: string) => {

    const doc = browsers.get(userId)
    if (doc) {

        let obj = {
            timestamp: Math.floor(Date.now() / 1000),
            username: doc.username,
            browser: doc.browser
        }

        browsers.set(userId, obj)

    }

}

const clearBrowsers = () => {

    let entriesToRemove: string[] = []

    browsers.forEach((value, key) => {
        if (value.timestamp < (Math.floor(Date.now() / 1000) - 120)) {
            entriesToRemove.push(key)
        }
    })

    entriesToRemove.forEach((key) => {
        browsers.delete(key)
        handleUserStoppedStreaming(key)
    })

}

const validateUserID = async (user: IUser) => {

    try {

        const handleJob = async (page: Page, browser: Browser) => {

            await page.goto('https://chaturbate.com/identity/')

            const h2 = await page.$('#age-verification-confirmation')
            if (h2) {

                await UserModel.updateOne({ _id: user._id }, {
                    $set: {
                        verified: true,
                        verifyAgain: false,
                        verifying: false,
                    }
                }).lean().exec()

                await browser.close()

            } else {

                const element = await page.$('a#new_id_highlight, a.new_id_highlight')

                if (element) {

                    await element.click()

                    await new Promise(r => setTimeout(r, 5000))
                    const url = page.url()
                    if (url.startsWith('https://chaturbate.com/identity/add_agreement/')) {

                        const nameInput = await page.$('input#id_name')
                        await nameInput!.type(user.name)

                        const emailInput = await page.$('input#id_email')
                        await emailInput!.type(user.email)

                        const submitBtn = await page.$('#agreement-btn')
                        await submitBtn!.click()

                        await new Promise(r => setTimeout(r, 7000))

                        const signature = await page.$('#id_signature')
                        await signature!.type(user.name)

                        const submitBtn2 = await page.$('input[type="submit"][value="I Agree"].button');
                        await submitBtn2!.click()

                        await new Promise(r => setTimeout(r, 5000))

                        await page.goto('https://chaturbate.com/identity/')

                        const h2 = await page.$('#age-verification-confirmation')
                        if (h2) {
                            await UserModel.updateOne({ _id: user._id }, {
                                $set: {
                                    verified: true,
                                    verifyAgain: false,
                                    verifying: false,
                                }
                            }).lean().exec()
                            await browser.close()
                        } else {
                            if (user.verifiedAmount === 2) {

                                await UserModel.updateOne({ _id: user._id }, {
                                    $set: {
                                        verifyAgain: true,
                                        verified: false,
                                        verifying: false,
                                    },
                                }).lean().exec()

                            } else {
                                await UserModel.updateOne({ _id: user._id }, {
                                    $set: {
                                        verifyAgain: false,
                                        verified: false,
                                        verifying: false,
                                        lastVerified: Math.floor(Date.now() / 1000)
                                    },
                                    $inc: {
                                        verifiedAmount: 1
                                    }
                                }).lean().exec()
                            }
                        }

                    } else {

                        if (user.verifiedAmount === 2) {

                            await UserModel.updateOne({ _id: user._id }, {
                                $set: {
                                    verifyAgain: true,
                                    verified: false,
                                    verifying: false,
                                },
                            }).lean().exec()

                        } else {
                            await UserModel.updateOne({ _id: user._id }, {
                                $set: {
                                    verifyAgain: false,
                                    verified: false,
                                    verifying: false,
                                    lastVerified: Math.floor(Date.now() / 1000)
                                },
                                $inc: {
                                    verifiedAmount: 1
                                }
                            }).lean().exec()
                        }

                        await browser.close()
                    }


                } else {

                    if (user.verifiedAmount === 2) {

                        await UserModel.updateOne({ _id: user._id }, {
                            $set: {
                                verifyAgain: true,
                                verified: false,
                                verifying: false,
                            },
                        }).lean().exec()

                    } else {
                        await UserModel.updateOne({ _id: user._id }, {
                            $set: {
                                verifyAgain: false,
                                verified: false,
                                verifying: false,
                                lastVerified: Math.floor(Date.now() / 1000)
                            },
                            $inc: {
                                verifiedAmount: 1
                            }
                        }).lean().exec()
                    }

                    await browser.close()

                }

            }

        }

        const browser = await puppeteer.launch({
            headless: false,
            args: [
                `--disable-extensions-except=${extensionPath}`,
                `--load-extension=${extensionPath}`,
                `--no-sandbox`,
                '--disable-features=IsolateOrigins',
                '--disable-web-security',
            ],
            executablePath: '/usr/bin/google-chrome-stable',
            defaultViewport: {
                width: 1400,
                height: 800,
                isMobile: false
            },
            env: {
                DISPLAY: ':99'
            }
        })

        const page = await browser.newPage()
        await page.setBypassCSP(true)

        const userAgent = new agent({ deviceCategory: 'desktop' }).toString()

        await page.setUserAgent(userAgent)
        await page.setRequestInterception(true)

        const responseListener = async (response: any) => {
            const url = response.url();
            const status = response.status();

            if (url === 'https://chaturbate.com/auth/login/' && status === 302) {
                await handleJob(page, browser)
                page.off('response', responseListener);
            }
        }

        page.on('request', (request: any) => {
            request.continue()
        })

        page.on('response', responseListener)

        await page.goto('https://chaturbate.com/auth/login')

        await new Promise((r) => setTimeout(r, 2000))

        const userInput: any = await page.$('#id_username');
        await userInput.type(user.account_username, { delay: 200 });

        await new Promise((r) => setTimeout(r, 1250));

        const passInput: any = await page.$('#id_password');
        await passInput.type(user.account_password, { delay: 180 });

        const btn: any = await page.$('input[type="submit"]');
        await new Promise((r) => setTimeout(r, 1250));
        await btn.click();

    } catch (err) {
        await UserModel.updateOne({ _id: user._id }, {
            $set: {
                lastVerified: Math.floor(Date.now() / 1000),
                verified: false,
                verifyAgain: true,
                verifying: false
            }
        })
    }

}

const closeBrowser = async (userId: string) => {
    const doc = browsers.get(userId)
    if (doc) {
        const browser = doc.browser
        await browser.close()
        browsers.delete(userId)
    }
}

const validateIds = async () => {
    try {

        const unix = (Math.floor(Date.now() / 1000) - 800)
        const accounts = await UserModel.find({ verifying: true, lastVerified: { $gte: unix } }).lean().exec()

        for (const a of accounts) {
            validateUserID(a)
        }

        return {}

    } catch (err) {
        return {}
    }
}

setInterval(() => {
    clearBrowsers()
}, 120 * 1000)

setInterval(() => {
    validateIds()
}, 15 * 60 * 1000)

export {
    launchBrowser,
    updateTimestamp,
    closeBrowser,
    validateUserID
}