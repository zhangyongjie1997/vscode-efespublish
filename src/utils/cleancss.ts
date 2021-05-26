import CleanCss from 'clean-css';
import less from 'less';

export const transformLess = async (css: string) => {
  let res = '';
  const lessData = await less.render(css, {
    compress: false,
  });

  if (lessData.css) {
    res = lessData.css;
  }
  return res;
};

export const transformCss = (css: string): string => {
  let transformed = '';
  try {
    transformed = (new CleanCss({
      rebase: false,
      compatibility: 'ie9',
    })).minify(css).styles;
  } catch (error) {
    transformed = error.message;
  }
  return transformed;
};
