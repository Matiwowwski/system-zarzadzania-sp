// webpack.config.js
const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', // Użyj babel-loader, aby obsługiwać nowoczesne funkcje JS
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'], // Użyj style-loader i css-loader do obsługi CSS
            },
        ],
    },
    resolve: {
        extensions: ['.js'], // Umożliwia importowanie plików JS bez podawania rozszerzenia
    },
    devtool: 'source-map', // Opcjonalnie, dla lepszego debugowania
};
