import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 获取 __dirname 的等效值
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 获取 src 目录下所有文件夹
const srcPath = path.resolve(__dirname, 'src');
const folders = fs.readdirSync(srcPath).filter((file) => {
    return fs.statSync(path.join(srcPath, file)).isDirectory();
});

// 动态生成入口和 HTML 插件配置
const entry = {};
const htmlPlugins = folders.map((folder) => {
    // 入口配置
    entry[folder] = `./src/${folder}/index.js`;

    // HTML 插件配置
    return new HtmlWebpackPlugin({
        template: `./src/${folder}/index.html`, // 模板文件路径
        filename: `${folder}.html`, // 输出文件名
        chunks: [folder], // 只引入当前入口的 JS 文件
    });
});

export default {
    entry,
    output: {
        filename: '[name].bundle.js', // 使用 [name] 占位符生成动态文件名
        path: path.resolve(__dirname, 'dist'),
        clean: true, // 清理 dist 文件夹
    },
    // devtool: 'eval-source-map',
    optimization: {
        minimize: false, // 禁用代码压缩
    },
    plugins: [...htmlPlugins], // 动态生成的 HTML 插件
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'], // 处理 CSS 文件
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource', // 处理图片文件
            },
        ],
    },
    mode: 'development', // 开发模式
};