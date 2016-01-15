Change Log
============

0.4.1.5 - 2016-01-15
-------------------------------------------------------------------------------
- Fix: PHP 5.2 compatibility issues.

0.4.1.4 - 2016-01-13
-------------------------------------------------------------------------------
- Fix: over-zealous filtering in text element.

0.4.1.3 - 2015-12-11
-------------------------------------------------------------------------------
- Fix: YouTube element protocol issue.
- Fix: WP 4.4 screen class issue with post element.

0.4.1.2 - 2015-11-16
-------------------------------------------------------------------------------
- Fix: like box  height snapping and centralized content.
- Fix: like box iframe going out of bounds width-wise.
- Fix: namespacing the cross-browser animation event.

0.4.1.1 - 2015-11-09
-------------------------------------------------------------------------------
- Fix: image links issues.
- Fix: button in group is opening url instead of edit text.
- Fix: syntax checks in code elements.
- Fix: parallax refresh error when rapidly change background style.
- Fix: parallax affects full width background.
- Fix: module group output z-index.
- Fix: enable region resizing after adding region.
- Add: content type macro to content expansion in posts element.

0.4.1 - 2015-10-26
-------------------------------------------------------------------------------
- Fix: redactor issue with icons in editor vs live.
- Fix: YouTube element issues.
- Fix: paralax mode issues with responsive and image selection.
- Fix: redactor text selection issues.
- Fix: like box trailing slash issue.
- Fix: responsive mode selection clearing and active break point issues.
- Fix: hadcoded gravatar protocol in sidebar.
- Fix: contact form name and l10n.
- Fix: text encoding issues in code and text element sanitization.
- Add: custom cursor for editing areas.
- Add: formatting via inline text expansion.
- Add: choice between theme layout and WP image inserts.
- Add: button element improvements.
- Add: new linking API.

0.4 - 2015-08-28
-------------------------------------------------------------------------------
- Fix: shortcodes in tabs/accordion elements.
- Fix: discussion settings update.
- Fix: responsive menu behavior.
- Fix: pagination issues.
- Fix: menu custom CSS saving in certain scenarios.
- Fix: YouTube element responsive behavior.
- Fix: image caption issues.
- Fix: lightbox creation issues.
- Fix: anchor link issues in menu element.
- Fix: text icons insertion issues.
- Fix: admin bar items issues.
- Add: styled map support for map elements and regions.
- Add: parallax type for image background regions.

0.3.2.1 - 2015-06-02
-------------------------------------------------------------------------------
- Fix: minor style fixes.
- Fix: legacy widget rendering.
- Fix: error in cache spawning.
- Fix: clean up multiplied listeners.

0.3.2 - 2015-05-29
-------------------------------------------------------------------------------
- Fix: images lightbox options.
- Fix: anchor links behavior.
- Fix: element groups and cloning.
- Fix: redactor formatting changes.
- Fix: global regions revert issues.
- Fix: backend content editing page templates issue.
- Fix: menu UI issues.
- Fix: "self" link selection options and rendering.
- Fix: anchors not taking into account sticky header height.
- Fix: text icons rendering.
- Fix: small height regions.
- Fix: prevent live preview when it's not supported.
- Fix: media paths SSL issues in certain setups.
- Fix: widget element changes.
- Fix: code element color picker.
- Fix: redactor and spectrum l10n strings.
- Add: augmented default search markup.
- Add: post date permalink in posts element.
- Add: posts element sticky posts handling options.

0.3.1 - 2015-05-05
-------------------------------------------------------------------------------
- Fix: responsive menu issues.
- Fix: background slider full-screen scroll issue.
- Fix: changing page templates with layouts in storage.
- Fix: changing menu links to pages.
- Fix: categories selection in new post creation.
- Fix: pagination in posts element.
- Fix: removing floating region restricted to header.
- Fix: listing all anchors in the menu.
- Fix: custom posts addition in posts element.
- Fix: gallery caption alignments.
- Fix: background video delayed loop.
- Fix: cloning within elements group.
- Fix: responsive elements positioning/ordering.
- Fix: accordion panel adding.
- Fix: discussion settings popup height.
- Fix: posts element taxonomy selection.
- Add: theme testing plugins widgets support.
- Add: posts element "Read more" tag support.
- Add: login element registration link support.
- Add: forms overrides support.

0.3 - 2015-04-02
-------------------------------------------------------------------------------
- Fix: menu rendering improvements.
- Fix: link behavior in grouped elements.
- Fix: slider element and region behavior.
- Fix: image inserts.
- Fix: first section element hide in responsive.
- Fix: linking panels update.
- Fix: accordion panel adding.
- Fix: gallery elements warnings and plugin conflicts.
- Fix: discussion settings update.
- Fix: adding playable video element 
- Fix: keyframe animations and media queries allowed in global CSS.
- Add: multiple global regions.

0.2.7.1 - 2015-03-17
-------------------------------------------------------------------------------
- Fix: resizing handle hidden when editing elements in group.
- Fix: hide settings button and resizable handle on group when editing elements.

0.2.7 - 2015-03-17
-------------------------------------------------------------------------------
- Fix: custom 404 layout changes saving.
- Fix: image embed in text/accordion editing.
- Fix: remove gallery image rotate functionality.
- Fix: clean up the passed popup classname parameter on close.
- Fix: image warning popup styles.
- Fix: skip prefixing the global CSS.
- Fix: validate the selected image size argument for code element.
- Fix: posts/pages popup bugging out if no author specified.
- Fix: drag and drop issue on the last element

0.2.6 - 2015-03-10
-------------------------------------------------------------------------------
- Fix: Fix image blocks UI when S3 plugins move images.
- Fix: youtube element accept short ahare url format i.e. youtu.be
- Fix: keep ratio behavior for full screen region
- Fix: muted video background
- Fix: theme colors in code element
- Fix: post layout wont apply to all post types
- Fix: accordion panel add button not showing
- Fix: multiple spectrums open
- Fix: disable alpha slider when theme color is chosen

0.2.5 - 2015-03-05
-------------------------------------------------------------------------------
- Fix: gallery labels adding.
- Fix: compensate for dead element double-click event.
- Fix: like box fixed misalignment of thumbnails.
- Fix: like box mapped return key to send action.
- Fix: too many controlls after element group and chosen nag for sprites.

0.2.4 - 2015-03-04
-------------------------------------------------------------------------------
- Fix: YouTube and tabs elements.
- Fix: occasional spectrum-related nag.
- Fix: background image lazy loading not loaded in floating region.
- Fix: post status model inheritance.
- Added: close button for responsive menu navigation.
- Added: map markers toggling for map element and region.
- Added: autoplay option for video background.

0.2.3 - 2015-02-24
-------------------------------------------------------------------------------
- Fix: ensure slider dots are inside element.
- Fix: default styling for contact form.
- Fix: layout saves in new post writing experience and module selector.
- Fix: anonymous mode AJAX request layout resolution update.
- Fix: default date formats for posts element.

0.2.2 - 2015-02-23
-------------------------------------------------------------------------------
- Fix: responsive menu positioning.
- Fix: desktop breakpoint responsive typography.
- Fix: slider element slide removal.
- Fix: button element bugs.

0.2.1 - 2015-02-20
-------------------------------------------------------------------------------
- Fix: add typography defaults.
- Fix: background slider image removal.
- Fix: responsive typography.

0.2.0 - 2015-02-19
-------------------------------------------------------------------------------
- Fix: menu handling in responsive.
- Fix: link panels custom URL entry.
- Fix: handling empty gallery description.
- Fix: contact element behavior.
- Fix: redactor breaks and wpautop conflict in text editing.
- Fix: immediate image inserts publishing.
- Fix: default gravatar handling.
- Fix: media (de)selection for single items.
- Added: editable theme colors support.

0.1.3 - 2015-02-09
-------------------------------------------------------------------------------
- Fix: z-index overlap in case of multiple menus.
- Fix: navigation resizing bugs.
- Fix: input fields focus.
- Fix: drag and drop when there's only one element inside region.

0.1.2 - 2015-02-02
-------------------------------------------------------------------------------
- Fix: text copy/paste issues.
- Fix: contact form displaying (false) on mail sent
- Fix: use absolute URLs for theme images.
- Fix: editor copy/paste and color assignment issues.
- Added: posts with no featured image get special class in posts element.

0.1.1 - 2015-01-26
-------------------------------------------------------------------------------
- Second public Beta release.

0.1.0 - 2015-01-21
-------------------------------------------------------------------------------
- Initial public Beta release.