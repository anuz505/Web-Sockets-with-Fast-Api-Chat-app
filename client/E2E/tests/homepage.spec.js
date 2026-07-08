import { test, expect } from '@playwright/test';
import { HomePage } from '../page-objects/HomePage.js';
import { LoginPage } from '../page-objects/LoginPage.js';
import { users } from '../test-data/users.js';

test.describe('Home Page', () => {

    let homePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.goTo();
    });

    test('page loads successfully', async ({page}) => {
        await expect(page).toHaveURL('/');
        await expect(page).toHaveTitle(/SarcasmSync/);
    });

    test('login link redirects to login page', async ({page}) => {
        await homePage.clickNavLink('Login');
        await expect(page).toHaveURL(/\/login/);
    });

    //unauthenticated
    const protectedLinks = ['Chat', 'Friends', 'Requests', 'Discover'];

    for (const link of protectedLinks) {
        test(`${link} redirects unauthenticated users to login page`, async ({page}) => {
            await homePage.clickNavLink(link);
            await expect(page).toHaveURL(/\/login/);
        });     
    }
    
    test('Start chatting redirects unauthenticated users to login page', async ({page}) => {
        await homePage.clickStartChatting();
        await expect(page).toHaveURL(/\/login/);
    });

    test('Learn more button navigates nowhere', async () => {

        const currentURL = homePage.page.url();

        await homePage.clickLearnMore();  
        
        await expect(homePage.page).toHaveURL(currentURL);      
    });

    test('rotating quote changes automatically', async () => {
        
        const quoteElement = homePage.elements.rotatingQuote;
        const observedQuotes = new Set();

        const duration = 15000; 
        const startTime = Date.now();

        let currentText = await homePage.getRotatingQuoteText();

        console.log('Quote:', currentText);
        observedQuotes.add(currentText);

        while (Date.now() - startTime < duration) {
            await expect(quoteElement).not.toHaveText(currentText, { timeout: 5000 });
            
            currentText = await homePage.getRotatingQuoteText();

            console.log('Quote:', currentText);
            observedQuotes.add(currentText);
        }

        console.log('Total quotes observed:', observedQuotes.size);
        expect(observedQuotes.size).toBeGreaterThan(1);
    });

    //authenticated 
    test.describe('Authenticated user', () => {

        test.describe.configure({ mode: 'serial' }); 
 
        test.beforeEach(async ({ page }) => {
            const loginPage = new LoginPage(page);
            await loginPage.goTo();
            await loginPage.login(users[0]);
            await expect(page).toHaveURL(/chat/);
 
            homePage = new HomePage(page);
            await homePage.goTo();
        });

        const authenticatedLinks = [
            { name: 'Chat',     url: /\/chat/ },
            { name: 'Friends',  url: /\/friends/ },
            { name: 'Requests', url: /\/friend-requests/ },
            { name: 'Discover', url: /\/discover/ },
        ];
 
        for (const link of authenticatedLinks) {
            test(`${link.name} takes authenticated user to ${link.url}`, async ({ page }) => {
                await homePage.clickNavLink(link.name);
                await expect(page).toHaveURL(link.url);
            });
        }
 
        test('Start chatting takes authenticated user to chat page', async ({ page }) => {
            await homePage.clickStartChatting();
            await expect(page).toHaveURL(/\/chat/);
        });

    });

});
