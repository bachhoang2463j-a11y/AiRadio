// 打包单 HTML：内嵌 jQuery 与剥离后的电台脚本
const fs = require('fs');
const jquery = fs.readFileSync('D:/Project/AiRadio/tools/jquery-3.7.1.min.js', 'utf8');
const script = fs.readFileSync('D:/Project/AiRadio/tools/standalone_script.js', 'utf8');

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>音乐电台 · Celestial Radio</title>
<style>
    html, body { margin: 0; padding: 0; width: 100%; height: 100%; background: #05070d; overflow: hidden; }
</style>
<script>
${jquery}
</script>
</head>
<body>
<script>
${script}
</script>
</body>
</html>
`;

fs.writeFileSync('D:/Project/AiRadio/音乐电台-单机版.html', html);
console.log('packed bytes:', html.length);
