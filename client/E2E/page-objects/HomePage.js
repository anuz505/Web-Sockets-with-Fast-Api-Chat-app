export class HomePage {
    constructor(page) {
        this.page = page;

        this.elements = {
            nav: page.getByRole('navigation'),
            startChattingButton: page.getByRole('button', { name: 'START CHATTING' }),
            learnMoreBtn: page.getByRole('button', { name: 'LEARN MORE' }),
            rotatingQuote: page.getByTestId('rotating-quote'),
        };
    }

    async goTo() {
        await this.page.goto('/');
    }

    async clickNavLink(linkName) {
        await this.elements.nav.getByRole('link', { name: linkName }).click();
    }

    async clickStartChatting() {
        await this.elements.startChattingButton.click();
    }

    async clickLearnMore() {
        await this.elements.learnMoreBtn.click();
    }

    async clickLogin() {
        await this.clickNavLink('Login');
    }

    async getRotatingQuoteText() {
        return await this.elements.rotatingQuote.textContent();
    }

}

