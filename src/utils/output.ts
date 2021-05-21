import { window, OutputChannel } from 'vscode';

interface FunctionPropertyDescriptor<T = (arg: any) => any> {
    configurable?: boolean;
    enumerable?: boolean;
    writable?: boolean;
    value?: T;
    get?(): T;
    set?(v: T): void;
}

const warpers = {
    error: [
        '\n<======= ERROR =======>',
        '<======= ERROR END =======>'
    ],
    message: [
        '\n<======= MESSAGE =======>',
        '<======= MESSAGE END =======>'
    ]
};

const output = window.createOutputChannel('efes-publish');


function warp(warperName: keyof typeof warpers) {
    return function outputDescriptor(target, property, descriptor: FunctionPropertyDescriptor) {
        const warper = warpers[warperName];
        const func = descriptor.value;
        descriptor.value = function warpedOutputFunction(...args: any) {
            output.appendLine(warper[0]);
            func.apply(this, args);
            output.appendLine(warper[1]);
        }
    }
}



class Output {
    private output: OutputChannel = output;
    
    @warp('error')
    public error(message: string): void {
        this.output.show();
        this.output.append(message);
    }

    @warp('error')
    public errorLine(message: string): void {
        this.output.show();
        this.output.appendLine(message);
    }

    @warp('message')
    public messageLine(message: string): void {
        this.output.appendLine(message);
    }

    @warp('message')
    public message(message: string): void {
        this.output.append(message);
    }
}

export default new Output();
