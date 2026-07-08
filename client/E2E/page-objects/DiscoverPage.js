export class DiscoverPage {
    constructor(page) {
        this.page = page;
    }

    async goTo() {
        await this.page.goto('/discover');
        await this.page.waitForSelector('[data-testid="user-card"]'); 
    }

    async addFriend(username) {
    const card = this.getUserCard(username);
        await card.first().waitFor();
    await card.getByRole('button', { name: 'ADD FRIEND' }).click();
    }
        
    getUserCard(username) {
        return this.page.getByTestId('user-card').filter({ hasText: username });
    }
 
    async isUserVisible(username) {
        return await this.getUserCard(username).count() > 0;
    }

}