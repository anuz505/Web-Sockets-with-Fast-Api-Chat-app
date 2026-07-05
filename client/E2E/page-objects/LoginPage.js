export class LoginPage {

    constructor(page) {

        this.page = page;

        this.elements = {
            userNameInput: page.locator('#username'),
            passwordInput: page.locator('#password'),
            signInButton: page.getByRole('button', { name: 'Sign in' }),
        };
    }

    get userNameInput() {
        return this.elements.userNameInput;
    }

    get passwordInput() {
        return this.elements.passwordInput;
    }

    async goTo() {
        await this.page.goto('/login');
    }

    async fillUsername(username) {
        await this.elements.userNameInput.fill(username);
    }

    async fillPassword(password) {
        await this.elements.passwordInput.fill(password);
    }

    async fillForm(username, password) {
        await this.fillUsername(username);
        await this.fillPassword(password);
    }

    async submit() {
        await this.elements.signInButton.click();
    }

    async login(user) {
        await this.fillForm(user.username, user.password);
        await this.submit();
    }
    
}