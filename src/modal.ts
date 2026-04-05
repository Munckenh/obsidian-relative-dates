import { App, Modal, Setting } from 'obsidian';

export class ConfirmationModal extends Modal {
    constructor(app: App, cta: string, title: string, text: DocumentFragment, onSubmit: () => void) {
        super(app);
        this.setTitle(title);

        const p = this.contentEl.createEl('p');
        p.appendChild(text);

        new Setting(this.contentEl)
            .addButton((btn) => {
                btn
                    .setButtonText('Nevermind')
                    .onClick(() => this.close());
            })
            .addButton((btn) => {
                btn
                    .setButtonText(cta)
                    .setCta()
                    .onClick(() => {
                        this.close();
                        onSubmit();
                    });
            });
    }
}