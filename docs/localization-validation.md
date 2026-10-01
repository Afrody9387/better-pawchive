# 语言与汉化测试 / Language and translation checklist

1. 更新扩展并刷新网站。打开扩展图标 → Manage Data → Settings → Language，选择简体中文。
   Update and refresh tabs. Open the extension → Manage Data → Settings → Language and select 简体中文.
2. 检查弹窗、管理页导航、统计、设置和删除确认文字；作者名和帖子标题应保持原文。
   Check popup labels, management navigation, counts, settings, and delete confirmations. Names and titles must remain original.
3. 在 Pawchive 查看导航、作者搜索框、排序、作者页 Posts / Similar Artists / Favorite。
   Check Pawchive navigation, creator search, sorting, and profile tabs / favorite controls.
4. 切换作者页、搜索及相似作者，点击浏览器后退／前进。新加载及历史页面仍应正确汉化。
   Navigate between profiles, search and similar artists; use browser back/forward. Dynamic and history pages should stay translated.
5. 登录后点击卡片星星关注／取消关注，并进入作者页确认状态。按钮和提示应为中文。
   Sign in, favorite/unfavorite from a card, and verify on the profile. Labels and messages should be Chinese.
6. 在支持的来源平台检查跳转按钮为中文，点击后仍打开正确页面。
   Check the Chinese jump button on a supported source platform and verify its destination.
7. 关闭“中文模式下汉化 Pawchive 页面”：网站恢复英文，扩展界面仍为中文。重新开启后网站恢复中文。
   Turn off site translation: Pawchive returns to English while extension controls stay Chinese. Re-enable to restore Chinese.
8. 切回 English：扩展和网站恢复英文。重新选择中文，关闭／重新打开浏览器，设置应保留。
   Switch to English to restore English throughout. Select Chinese again and restart the browser to verify persistence.

自动化验证：244 项测试；包含保存失败恢复、内容保护、原生点击事件、动态关注状态及 HTMX 历史恢复。实机登录及浏览器重启流程请按以上步骤验证。
Automated validation: 244 tests, including save failures, content protection, native click handlers, favorite state updates and HTMX history restoration. Authenticated and browser restart flows require the live checks above.
