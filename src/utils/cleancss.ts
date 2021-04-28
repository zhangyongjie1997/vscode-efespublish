import CleanCss, { Output } from 'clean-css';
import less from 'less';

export const transformLess = async (css: string, src?: string) => {
    let res = ''
    const lessData = await less.render(css, {
        compress: false,
    });

    if (lessData.css) {
        res = lessData.css;
    }
    return res
}

export const transformCss = (css: string): Output => {
    return (new CleanCss({
        rebase: false,
        compatibility: 'ie9',
    })).minify(css)
}
