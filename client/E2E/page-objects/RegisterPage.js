export class RegisterPage {
    constructor(page) {

        this.page = page;

        this.elements = {
            userNameInput: page.locator('#username'),
            emailInput: page.locator('#email'),
            passwordInput: page.locator('#password'),
            createAccountButton: page.getByRole('button', { name: 'Create account' }),
        };
    }

    get userNameInput() {
        return this.elements.userNameInput;
    }

    get emailInput() {
        return this.elements.emailInput;
    }

    get passwordInput() {
        return this.elements.passwordInput;
    }

    async goTo() {
        await this.page.goto('/register',{waitUntil: 'domcontentloaded'});
    }

    async fillUsername(username) {
        await this.elements.userNameInput.fill(username);
    }

    async fillEmail(email) {
        await this.elements.emailInput.fill(email);
    }

    async fillPassword(password) {
        await this.elements.passwordInput.fill(password);
    }

    async fillForm(username, email, password) {
        await this.fillUsername(username);
        await this.fillEmail(email);
        await this.fillPassword(password);
    }

    async submit() {
        await this.elements.createAccountButton.click();
    }

    async register(user) {
        await this.fillForm(user.username, user.email, user.password);
        await this.submit();
    }

}
