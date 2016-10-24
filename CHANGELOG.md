Change Log
============

1.5 - 2016-10-24
-------------------------------------------------------------------------------
- Add: WooCommerce support
- Add: padding setting to individual post part on post data elements
- Add: region settings moved to the sidebar
- Add: global region reset toggle to reset options area in admin

- Fix: prevent double clicking on padding control to open group editing
- Fix: region bg issue if total grid width is more than the screen width
- Fix: improve layout rendering by change finite timeouts to pubsub
- Fix: improve compatibility with anchoring with the Domain Mapping plugin
- Fix: keyboard controlled padding is broken
- Fix: slider side caption bug
- Fix: remove upfront template admin notice on post types
- Fix: element padding panel gets cut when on bottom of page
- Fix: Upfront notifier z-index
- Fix: redactor inline panel over post select popup
- Fix: accordion editor exit issue

1.4.3 - 2016-10-05
-------------------------------------------------------------------------------
- Add: compress data when saving
- Add: loop option for youtube element and video region
- Add: streamlined group settings to sidebar
- Add: improved element padding controls
- Add: improved image insert trigger behavior

- Fix: default bg for triggered menu not rendered
- Fix: menu element inline link panel hidden when on bottom of page
- Fix: sidebar more menu overlapped with element settings panel
- Fix: esc key issue on builder getting started dialog
- Fix: overlapping issue with the inline image button
- Fix: only warn users when multiple tabs are open for the current layout
- Fix: issue with notifications/warnings being hidden behind the media overlay
- Fix: restyle initial state of the menu element
- Fix: error when preset is deleted on different breakpoint
- Fix: slider element with side caption resizing issue
- Fix: can't delete login element after editing default appearance
- Fix: post/page setting not displayed first time
- Fix: parallax background issue on firefox
- Fix: layout naming issue in admin list
- Fix: post data meta element issue
- Fix: rtl position issues
- Fix: gallery image controls overlapped issue
- Fix: can't create new menu in menu element
- Fix: prevent save as draft to include shadow region


1.4.2 - 2016-09-15
-------------------------------------------------------------------------------
- Add: ability to switch menus for breakpoints.
- Add: button to delete a group of elements
- Add: improved control on different region background per breakpoint

- Fix: image element size when switching to responsive layout
- Fix: resizing didn't get updated the first time
- Fix: post content update issues
- Fix: unable to show the elements when hidden region is toggled in responsive
- Fix: menu issue after theme reset
- Fix: undefined error when editing Featured image
- Fix: menu glitch with repeated responsive change


1.4.1 - 2016-09-13
-------------------------------------------------------------------------------
- Fix: scheduled scans conflict issue.


1.4.0 - 2016-09-07
-------------------------------------------------------------------------------
- Add: support for meta description element for pages.
- Add: empty global regions/lightboxes message.
- Add: changelog review area.
- Add: refactored login element.
- Add: allow different style to be applied on each slide per breakpoint.
- Add: initial Empty API Message and overlay to Map element.
- Add: compatibility with Upfront Builder

- Fix: parallax with PNG files and transparent backgrounds.
- Fix: image inserts linking panel.
- Fix: admin element toggling order issue.
- Fix: issue in reverting to initial color in color picker.
- Fix: gallery lightbox options application on frontend.
- Fix: sync arrows padding with advanced settings.
- Fix: remove categories data element from pages.
- Fix: improve widget element error message rendering.
- Fix: insert font issue in responsive mode editing.
- Fix: javascript error on submit contact form.
- Fix: post date PHP format issue.
- Fix: issues in background image resolution.
- Fix: consolidate fonts usage.
- Fix: responsive image variant rendering.


1.3.3 - 2016-07-19
-------------------------------------------------------------------------------
- Add: Google Maps API key area in admin
- Fix: global regions issue.
- Fix: global theme settings issue.


1.3.2 - 2016-06-24
-------------------------------------------------------------------------------
- Fix: drag and drop on responsive issue.
- Fix: burger menu not working in desktop breakpoint.


1.3.1 - 2016-06-20
-------------------------------------------------------------------------------
- Fix: archive layouts saving issues.
- Fix: posts element specific post settings issue.
- Fix: featured image data element edge cases handling.


1.3 - 2016-06-17
-------------------------------------------------------------------------------
- Add: reusable custom layout templates.
- Add: new posts/pages editing experience.
- Add: dedicated posts and pages settings area.

- Fix: performance improvements.
- Fix: show region button position in responsive.
- Fix: multiple lightboxes conflict.
- Fix: editor mode navigation in posts element.
- Fix: padding keyboard controls in inline panels.
- Fix: top padding change updates element height.
- Fix: trailing closing comment being stripped from custom CSS.
- Fix: issue with Pro Sites upload quotas.


1.2.2 - 2016-04-29
-------------------------------------------------------------------------------
- Fix: store image element_size property per breakpoint.

1.2.1 - 2016-04-28
-------------------------------------------------------------------------------
- Fix: featured image swap button issue.
- Fix: admin area shared abstraction checks.
- Fix: make the posts and comments dialog link context-aware.
- Fix: same ID being used with multiple calendar widgets.
- Fix: include new strings for l10n.
- Fix: refactor deprecated jQuery calls.
- Fix: allow responsive per-preset post data element indents.

1.2 - 2016-04-14
-------------------------------------------------------------------------------
- Add: admin interface.
- Add: general and debug settings in admin interface.
- Add: user roles restrictions in admin interface.
- Add: experimental performance optimization in admin interface.
- Add: image element redesign.
- Add: ready-made CSS selectors for post data elements.
- Add: keyboard shortcut for grid toggle (Alt+G)

- Fix: text element with image in content options issue.
- Fix: responsive breakpoint toggling image sizes in editor.
- Fix: code element resizing/height issue.
- Fix: post part inputs editing issue.
- Fix: gallery element caption text options.
- Fix: responsive bottom padding clearing issue.
- Fix: responsive performance issue.
- Fix: background map region controls edit issue.
- Fix: optimize refresh in rearranging menu element items.

1.1.1 - 2016-03-31
-------------------------------------------------------------------------------
- Fix: double enter on list editing should end list behavior.
- Fix: native WP aligned images style conflict.
- Fix: code element with pre-existing content editables action.
- Fix: breakpoints check for IE8.
- Fix: media queries support for IE8.
- Fix: featured image wrapper takes space with hide fallback.
- Fix: element with user set padding resize calculus.

1.1 - 2016-03-23
-------------------------------------------------------------------------------
- Add: new single post layout editing experience.
- Add: right-to-left compatibility.
- Add: media manager page size.
- Add: new responsive region editing trigger location.
- Add: posts dialog sorting.
- Add: ability to select items across pages in media manager.
- Fix: gallery element linking issue.
- Fix: button element default preset.
- Fix: list creation alignment issue in content editing.
- Fix: slider preset captions issue.
- Fix: disallow spaces in uploaded images.
- Fix: slider initial image size issue.
- Fix: map element and region address refresh issue.
- Fix: content editing link insertion in certain scenarios issue.
- Fix: button element resizing and padding issue.
- Fix: IE11 page/post layout edit link issue.
- Fix: better asset optimization.
- Fix: global background with parallax issue.
- Fix: map element code editor resize issue.

1.0.5 - 2016-02-19
-------------------------------------------------------------------------------
- Fix: remove text element edit content overlay
- Fix: show background padding settings only for regions
- Fix: redactor inline mode edit issue
- Fix: new region controls issue
- Fix: tab label styles not applied in paragraphs
- Fix: prevent lightbox region columns from exceeding breakpoint columns
- Fix: prevent group resizing when entering edit element
- Fix: gallery images black areas on thumbnails resize edge cases
- Fix: gallery initial overlay styles, font styles and default preset value
- Fix: login element z-index issue in editor
- Fix: theme colors being inserted with expanded values
- Fix: preset CSS style cleanup
- Fix: re-render slider elements on Preset settings updated
- Fix: region editing corner trigger not accessible in responsive
- Fix: z-index issue with small-sized groups

1.0.4 - 2016-02-09
-------------------------------------------------------------------------------
- Fix: styling issue

1.0.3 - 2016-02-09
-------------------------------------------------------------------------------
- Drag and drop fixes and performance improvements
- Fix for an issue with pressing Tab key during menu item inline text editing
- Fix issue when using shift-enter double break at the end of an element
- Fix issues with inserts in tab and accordion elements
- Fix preset colors live update in editor
- Fix browser cache upgrade artifacts
- Fix image caption using hardcoded caption color
- Fix image border not properly applied
- Fix gallery caption module shows position options though unchecked
- Fix text element issues with preset creation on migration
- Fix issue with text element contextual menu editing

1.0.2 - 2016-02-04
-------------------------------------------------------------------------------
- Fix: rounded corner module improvements.
- Fix: preset name suggestion will offer an unique preset name.
- Fix: backup link in the upgrade popup recognizes the plugin.

1.0.1 - 2016-01-28
-------------------------------------------------------------------------------
- Fix: compatibility with old PHP versions.
- Fix: color picker appearance near right border.
- Fix: minor style issues.

1.0 - 2016-01-27
-------------------------------------------------------------------------------
- Entirely new way of working with elements size and position:
	+ New drag and drop will make the elements snap-align to other elements on your page.
	+ New concept of "spacer" elements that can be resized and snapped to.
	+ New, more obvious appearance of resizeable elements.
	+ New, more intuitive way in which the element resizing behaves.
- Entirely new element settings:
	+ Whole new design for settings and a brand new use for the sidebar area screen realestate.
	+ Better options organization.
	+ Zero-code advanced appearance editing (colors, borders, corners, typography...), with custom CSS still available for advanced users.
	+ Reusable element configurations:
		* The new presets (available in element settings) allow for having easily available reusable element styles.
		* Presets also store entire element configurations with all their settings included.
		* Live preview of all changes.
- Less error-prone element interaction:
	+ Instead of interacting with elements by hovering over them, you now click to select them. This makes for way less interference with other elements, or other things that can happen on mouse hovering (hover styles/events).
	+ Element settings are now much farther apart from the element removal button, and styled differently.
	+ Quick, no-code access to element padding.
- Improvements:
	+ Added the ability to change typography of text element without custom CSS.
	+ Various fixes in redactor, improved reliability in text editing
	+ Added the ability to create rounded corner for image element without custom CSS.
	+ Improved slider controls.
	+ Added the ability to style tab title.
	+ Improved compatibility with https.
	+ Added Upfront logo in top Upfront button.
	+ No more warning popup when Upfront button is clicked before the system is fully loaded.
- Bug fixes.

- Fixed the bug related to assigning hyperlink to text containing icons.
- Fixed caption bug in image element.
- Fixed caption bug in gallery element.
- Fixed refresh bug in gallery element.
- Fixed resize bug in slider element.
- Fixed resize bug in map element.
- Fixed responsive bug in menu element.
- Fixed initial state of tabs element.
- Fixed styling bug related to tab content.
- Fixed initial state of accordion element.
- Fixed styling bug related to accordion content.
- Fixed some occurrences of wrong z-index value.
- Fixed few typos in editor interface.
- Fixed menu item bug when using Upfront in IE 11.
- Fixed the appearance of featured images.
- Fixed some issues with post meta.
- Fixed display bug when Upfront is used with Spanish language.
- 100+ other minor fixes and improvements.

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
