/**
 * 广汇龙电镀设备官网 - 联系表单处理 API
 * Cloudflare Pages Function
 *
 * 功能：接收访客提交的咨询表单，自动生成 Word 文档，
 *       通过 Resend 邮件 API 发送到 705358887@qq.com
 *
 * 环境变量：RESEND_API_KEY (在 Cloudflare Pages 设置中配置)
 */

const TO_EMAIL = '705358887@qq.com';
const FROM_EMAIL = 'onboarding@resend.dev';
const SITE_URL = 'https://ghl-website.pages.dev/';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}

export async function onRequestPost({ request, env }) {
  try {
    const data = await request.json();
    const { name, phone, company, message } = data;

    // 表单验证
    if (!name || !phone) {
      return jsonResponse({
        success: false,
        message: '请填写姓名和联系电话',
      }, 400);
    }

    // 检查 Resend API Key 是否配置
    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
      return jsonResponse({
        success: false,
        message: '邮件服务尚未配置，请联系网站管理员设置 RESEND_API_KEY',
      }, 500);
    }

    // 1. 生成 Word 文档 (HTML-based .doc 格式，Word/WPS均可打开)
    const wordDoc = generateWordDocument({ name, phone, company, message });

    // 2. 转换为 base64 (UTF-8 安全)
    const base64Doc = utf8ToBase64(wordDoc);

    // 3. 生成邮件 HTML 正文
    const emailHtml = generateEmailHtml({ name, phone, company, message });

    // 4. 通过 Resend API 发送邮件 (含 Word 附件)
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: TO_EMAIL,
        subject: '[网站咨询] ' + name + ' - 广汇龙电镀设备询价',
        html: emailHtml,
        attachments: [{
          filename: '客户咨询_' + name + '_' + phone + '.doc',
          content: base64Doc,
        }],
      }),
    });

    const result = await emailResponse.json();

    if (emailResponse.ok) {
      return jsonResponse({
        success: true,
        message: '咨询信息已发送成功！我们将在24小时内与您联系。',
      });
    } else {
      console.error('Resend API error:', result);
      return jsonResponse({
        success: false,
        message: '邮件发送失败：' + (result.message || '未知错误'),
      }, 500);
    }
  } catch (error) {
    console.error('Contact form error:', error);
    return jsonResponse({
      success: false,
      message: '服务器错误：' + error.message,
    }, 500);
  }
}

// ============================================
// 工具函数
// ============================================

function jsonResponse(data, status) {
  status = status || 200;
  return new Response(JSON.stringify(data), {
    status: status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
  });
}

// UTF-8 安全的 base64 编码（处理中文字符）
function utf8ToBase64(str) {
  var bytes = new TextEncoder().encode(str);
  var binary = '';
  for (var i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// HTML 转义，防止 XSS
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 格式化时间
function formatTime() {
  var now = new Date();
  var pad = function(n) { return String(n).padStart(2, '0'); };
  return now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
    ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
}

// ============================================
// 生成 Word 文档 (HTML-based .doc)
// ============================================
function generateWordDocument(data) {
  var name = escapeHtml(data.name);
  var phone = escapeHtml(data.phone);
  var company = escapeHtml(data.company || '未填写');
  var message = escapeHtml(data.message || '客户未填写具体需求，请电话沟通了解详情。');
  var timeStr = formatTime();

  return '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
    'xmlns="http://www.w3.org/TR/REC-html40">' +
    '<head>' +
    '<meta charset="utf-8">' +
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">' +
    '<title>客户咨询信息</title>' +
    '<!--[if gte mso 9]><xml>' +
    '<w:WordDocument>' +
    '<w:View>Print</w:View>' +
    '<w:Zoom>100</w:Zoom>' +
    '<w:DoNotOptimizeForBrowser/>' +
    '</w:WordDocument>' +
    '</xml><![endif]-->' +
    '<style>' +
    '@page WordSection1 { size: 595.3pt 841.9pt; margin: 72pt 90pt 72pt 90pt; }' +
    'div.WordSection1 { page: WordSection1; }' +
    'body { font-family: "Microsoft YaHei", sans-serif; font-size: 10.5pt; color: #333; }' +
    'h1 { font-size: 20pt; color: #0A1628; border-bottom: 2pt solid #2EA7FF; padding-bottom: 8pt; margin-bottom: 4pt; }' +
    '.subtitle { font-size: 9pt; color: #888; margin-bottom: 20pt; }' +
    'h2 { font-size: 12pt; color: #2EA7FF; margin-top: 24pt; margin-bottom: 8pt; }' +
    'table { border-collapse: collapse; width: 100%; }' +
    'td { border: 0.5pt solid #ccc; padding: 8pt 12pt; vertical-align: top; font-size: 10.5pt; }' +
    'td.label { background: #F0F5FA; font-weight: bold; width: 30%; color: #0A1628; }' +
    'td.value { color: #333; }' +
    '.content-box { background: #F8FAFC; border-left: 3pt solid #2EA7FF; padding: 10pt 15pt; margin-top: 8pt; }' +
    '.footer { margin-top: 36pt; font-size: 9pt; color: #999; border-top: 0.5pt solid #eee; padding-top: 12pt; }' +
    '.footer p { margin: 2pt 0; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="WordSection1">' +
    '<h1>\u5e7f\u6c47\u9f99\u7535\u9540\u8bbe\u5907 \u2014 \u5ba2\u6237\u54a8\u8be2\u4fe1\u606f</h1>' +
    '<p class="subtitle">\u63d0\u4ea4\u65f6\u95f4\uff1a' + timeStr + ' | \u6765\u6e90\uff1a\u5e7f\u6c47\u9f99\u5b98\u7f51\u5728\u7ebf\u54a8\u8be2\u8868\u5355</p>' +
    '<h2>\u5ba2\u6237\u57fa\u672c\u4fe1\u606f</h2>' +
    '<table>' +
    '<tr><td class="label">\u59d3\u540d</td><td class="value">' + name + '</td></tr>' +
    '<tr><td class="label">\u8054\u7cfb\u7535\u8bdd</td><td class="value">' + phone + '</td></tr>' +
    '<tr><td class="label">\u516c\u53f8\u540d\u79f0</td><td class="value">' + company + '</td></tr>' +
    '</table>' +
    '<h2>\u9700\u6c42\u63cf\u8ff0</h2>' +
    '<div class="content-box"><p>' + message + '</p></div>' +
    '<div class="footer">' +
    '<p>\u2014\u2014 \u672c\u6587\u6863\u7531\u5e7f\u6c47\u9f99\u7535\u9540\u8bbe\u5907\u5b98\u7f51\uff08' + SITE_URL + '\uff09\u5728\u7ebf\u54a8\u8be2\u8868\u5355\u81ea\u52a8\u751f\u6210 \u2014\u2014</p>' +
    '<p>\u4e1c\u839e\u5e02\u5e7f\u6c47\u9f99\u7535\u9540\u8bbe\u5907\u6709\u9650\u516c\u53f8</p>' +
    '<p>\u8054\u7cfb\u4eba\uff1a\u674e\u5148\u751f | \u7535\u8bdd\uff1a189 2943 5843 | \u90ae\u7bb1\uff1a705358887@qq.com</p>' +
    '<p>\u5730\u5740\uff1a\u5e7f\u4e1c\u7701\u4e1c\u839e\u5e02\u864e\u95e8\u9547\u5065\u6c11\u8def4\u53f7101\u5ba4 | \u7edf\u4e00\u793e\u4f1a\u4fe1\u7528\u4ee3\u7801\uff1a91441900MA543CF12G</p>' +
    '</div>' +
    '</div>' +
    '</body>' +
    '</html>';
}

// ============================================
// 生成邮件 HTML 正文
// ============================================
function generateEmailHtml(data) {
  var name = escapeHtml(data.name);
  var phone = escapeHtml(data.phone);
  var company = escapeHtml(data.company || '未填写');
  var message = escapeHtml(data.message || '未填写');
  var timeStr = formatTime();

  return '<div style="font-family: Microsoft YaHei, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">' +
    '<h2 style="color: #0A1628; border-bottom: 2px solid #2EA7FF; padding-bottom: 8px; margin-bottom: 16px;">' +
    '\u60a8\u6536\u5230\u4e00\u6761\u6765\u81ea\u7f51\u7ad9\u7684\u54a8\u8be2\u4fe1\u606f</h2>' +
    '<p style="color: #666; font-size: 14px; margin-bottom: 16px;">\u63d0\u4ea4\u65f6\u95f4\uff1a' + timeStr + '</p>' +
    '<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">' +
    '<tr><td style="background: #F0F5FA; padding: 10px; border: 1px solid #ddd; font-weight: bold; width: 30%;">\u59d3\u540d</td><td style="padding: 10px; border: 1px solid #ddd;">' + name + '</td></tr>' +
    '<tr><td style="background: #F0F5FA; padding: 10px; border: 1px solid #ddd; font-weight: bold;">\u8054\u7cfb\u7535\u8bdd</td><td style="padding: 10px; border: 1px solid #ddd;">' + phone + '</td></tr>' +
    '<tr><td style="background: #F0F5FA; padding: 10px; border: 1px solid #ddd; font-weight: bold;">\u516c\u53f8\u540d\u79f0</td><td style="padding: 10px; border: 1px solid #ddd;">' + company + '</td></tr>' +
    '<tr><td style="background: #F0F5FA; padding: 10px; border: 1px solid #ddd; font-weight: bold;">\u9700\u6c42\u63cf\u8ff0</td><td style="padding: 10px; border: 1px solid #ddd;">' + message + '</td></tr>' +
    '</table>' +
    '<p style="color: #999; font-size: 12px; margin-top: 20px;">' +
    '\u8be6\u7ec6\u54a8\u8be2\u4fe1\u606f\u8bf7\u67e5\u770b\u9644\u4ef6\u4e2d\u7684Word\u6587\u6863\u3002<br>' +
    '\u6765\u6e90\uff1a\u5e7f\u6c47\u9f99\u7535\u9540\u8bbe\u5907\u5b98\u7f51\uff08' + SITE_URL + '\uff09</p>' +
    '</div>';
}
