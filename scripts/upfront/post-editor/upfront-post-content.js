;(function($){define(["text!upfront/templates/post-editor/edition-box.html"], function(editionBox_tpl){

// Replaces the tags in the templates
var PartMarkupCreator = function(){
	this.parts = {
		title: {replacements: ['%title%', '%permalink%'], editable:['%title%']},
		contents: {replacements: ['%contents%', '%excerpt%'], editable:['%contents%', '%excerpt%']},
		excerpt: {replacements: ['%excerpt%'], editable:['%excerpt%']}, 
		author: {replacements: ['%author%', '%author_url%', '%author_meta%'], editable:['%author%'], withParameters: ['%author_meta_', '%avatar_']},
		categories: {replacements: ['%categories%'], editable:[]},
		tags: {replacements: ['%tags%'], editable:[]},
		comments_count: {replacements: ['%comments_count%'], editable:[]},
		featured_image: {replacements: ['%image%', '%permalink%'], editable:['%image%']},
		date: {replacements: ['%date%', '%date_iso%'], editable:['%date%']},
		update: {replacements: ['%update%', '%date_iso%'], editable:['%update%']},
		author_gravatar: {replacements: ['%avatar_%'], editable:['%avatar%'], withParameters: ['%avatar_']}
	};

	this.markup = function(part, partContents, template, partOptions){
		var me = this,
		extraClasses = partOptions && partOptions.extraClasses ? partOptions.extraClasses : '',
		attributes = partOptions && partOptions.attributes ? partOptions.attributes : {},
		attrs = ''
		;

		_.each(attributes, function(value, key){
			attrs += key +'="' + value + '" ';
		});

		if (this.parts[part] && this.parts[part].replacements) {
			_.each(this.parts[part].replacements, function(tag){
				var markup = partContents[tag];
				if(me.parts[part].editable.indexOf(tag) !== -1){
					markup = '<div class="upfront-content-marker upfront-content-marker-' + part + ' ' + extraClasses + '" ' + attrs + '>' + markup + '</div>';
				}
				template = template.replace(tag, markup);
			});
		}

		if (this.parts[part] && this.parts[part].withParameters) {
			var withParameters = this.parts[part].withParameters;
			if(withParameters){
				_.each(withParameters, function(replacement){
					var regexp = new RegExp(replacement + "[^%]+%", 'gm'),
					tags = regexp.exec(template)
					;

					_.each(tags, function(tag){
						template = typeof partContents[tag] == 'undefined' ? '' : template.replace(tag, partContents[tag]);
					});
				});
			}
		}
		return template;
	};
};
var markupper = new PartMarkupCreator();

var PostContentEditor = Backbone.View.extend({
	events: {
		'click a': 'preventLinkNavigation',
		'click .upfront-content-marker-author' : 'editAuthor',
		'click .upfront-content-marker-date' : 'editDate',
		'click .upost_thumbnail_changer': 'editThumb',
		'click .upfront-postpart-tags': 'editTags',
		'click .upfront-postpart-categories': 'editCategories',
		'click .ueditor-action-pickercancel': 'editDateCancel',
		'click .ueditor-action-pickerok': 'editDateOk'
	},

	initialize: function(opts){
		this.post = opts.post;
		this.postView = opts.postView;
		this.triggeredBy = opts.triggeredBy || this.$('.upfront-content-marker').first();

		this.parts = {};
		this.partOptions = opts.partOptions;

		this.postAuthor = this.post.get('post_author');
		this.authorTpl = opts.authorTpl;

		this.contentMode = opts.content_mode;

		this.inserts = this.post.meta.getValue('_inserts_data') || {};

		this.$el.addClass('clearfix').css('padding-bottom', '60px');

		this.rawContent = opts.rawContent;
		this.rawExcerpt = opts.rawExcerpt;

		// prevent link navigation
		this.$('a').data('bypass', true);

		//Prevent dragging from editable areas
		var draggable = this.$el.closest('.ui-draggable');
		if(draggable.length)
			cancel = draggable.draggable('disable');

		this.prepareEditableRegions();
		this.prepareBar();
	},

	prepareEditableRegions: function(){
		var me = this;
		//Title
		this.parts.titles = this.$('.upfront-content-marker-title');

		if(this.parts.titles.length){
			var parent = this.parts.titles.parent();
			if (parent.is("a")) {
				parent.replaceWith(this.parts.titles);
			}
			this.onTitleEdited = _.bind(this.titleEdited, this);

			this.parts.titles
				.attr('contenteditable', true)
				/*.on('keyup', this.onTitleEdited)
				.on('keydown', function(e){
					if(e.which != 9) //TAB
						return;

					e.preventDefault();
					me.focus(me.$('.upfront-content-marker-contents'), true);
				})*/
			;
		}

		//Content
		this.parts.contents = this.$('.upfront-content-marker-contents');
		if(this.parts.contents.length){
			var isExcerpt = this.contentMode == 'post_excerpt',
			content = isExcerpt ? this.rawExcerpt: this.rawContent,
			editorOptions = isExcerpt ? this.getExcerptEditorOptions() : this.getContentEditorOptions()
			;
			this.onContentsEdited = _.bind(this.contentEdited, this);
			this.editors = [];
			this.parts.contents.html(content).ueditor(editorOptions);
			this.parts.contents.on('keyup', this.onContentsEdited);

			this.parts.contents.each(function(){
				me.editors.push($(this).data('ueditor'));
			});
			//There may be more than one editor, store the last one edited
			this.currentContent = this.parts.contents[0];
		}

		//Author
		this.parts.authors = this.$('.upfront-content-marker-author');
		if(this.parts.authors.length){
			var me = this,
			authors = Upfront.data.ueditor.authors,
			options = []
			;

			_.each(authors, function(a){
				options.push({value: a.ID, name: a.display_name});
			});

			this.authorSelect = new MicroSelect({options: options});
			this.authorSelect.on('select', function(authorId){
				me.changeAuthor(authorId);
			});

			this.$el.append(this.authorSelect.$el);
		}


        //Author Gravatar
        this.parts.author_gravatars = this.$('.upfront-content-marker-author-gravatar');
        if(this.parts.authors.length){
            var me = this,
                authors = Upfront.data.ueditor.authors,
                options = []
                ;

            _.each(authors, function(a){
                options.push({value: a.ID, name: a.display_name});
            });

            this.authorSelect = new MicroSelect({options: options});
            this.authorSelect.on('select', function(authorId){
                me.changeAuthor(authorId);
            });

            this.$el.append(this.authorSelect.$el);
        }
		//Date
		this.parts.dates = this.$('.upfront-content-marker-date');
		if(this.parts.dates.length){
			var me = this,
				datepickerData = {},
				options = [],
				date = this.post.get("post_date"),
				dateFormat = this.getDateFormat()
				 //dateFormatUI = Upfront.Util.date.php_format_to_jquery( this.partOptions.date && this.partOptions.date.format ? this.partOptions.date.format : Upfront.data.date.format )
			;

			datepickerData.minutes = _.range(0,60);
			datepickerData.hours = _.range(0,24);

			datepickerData.currentHour = date.getHours();
			datepickerData.currentMinute = date.getHours();

			this.datepickerTpl = _.template($(Upfront.data.tpls.popup).find('#datepicker-tpl').html());
			this.$el.prepend(this.datepickerTpl(datepickerData));

			this.datepicker = this.$('.upfront-bar-datepicker');

			this.datepicker.datepicker({
				changeMonth: true,
				changeYear: true,
				dateFormat: dateFormat,
				onChangeMonthYear: function(year, month, inst){
					var day = inst.selectedDay,
						prev_date = new Date(  me.parts.dates.text()  ),
						d = new Date ( year, month - 1, day, prev_date.getHours(), prev_date.getMinutes() )
					;

					me.parts.dates.html($.datepicker.formatDate(dateFormat, d));

					me.post.set("post_date", d);
					me.datepicker.datepicker("setDate", d);
				},
				onSelect : function(dateText){
					me.parts.dates.html(dateText);
				}
			});
		}

		//Featured image
		this.parts.featured = this.$('.upfront-content-marker-featured_image');
		if(this.parts.featured.length){
			var thumbId = this.post.meta.getValue('_thumbnail_id'),
			height = this.partOptions.featured_image && this.partOptions.featured_image.height ? this.partOptions.featured_image.height : 60
			;

			this.parts.featured.addClass('ueditor_thumb ueditable')
				.css({position:'relative', 'min-height': height + 'px', width: '100%'})
				.append('<div class="upost_thumbnail_changer" ><div>' + Upfront.Settings.l10n.global.content.trigger_edit_featured_image + '</div></div>')
				.find('img').css({'z-index': '2', position: 'relative'})
			;
		}


		//Taxonomies
		this.parts.tags = this.$('.upfront-postpart-tags');
		this.parts.categories = this.$('.upfront-postpart-categories');

		setTimeout(function(){
			if (me.triggeredBy.length) me.focus(me.triggeredBy, true);
		}, 200);
	},

	getExcerptEditorOptions: function(){
		return {
			linebreaks: false,
			autostart: true,
			focus: false,
			pastePlainText: true,
			airButtons: ['bold', 'italic']
		};
	},

	getContentEditorOptions: function(){
		return {
			linebreaks: false,
            replaceDivs: false,
			autostart: true,
			focus: false,
			pastePlainText: false,
			inserts: this.inserts
		};
	},

	editThumb: function(e){
		e.preventDefault();
		var me = this,
		target = $(e.target),
		postId = this.postId,
		img = target.parent().find('img'),
		loading = new Upfront.Views.Editor.Loading({
			loading: Upfront.Settings.l10n.global.content.starting_img_editor,
			done: Upfront.Settings.l10n.global.content.here_we_are,
			fixed: false
		}),
		imageId = this.post.meta.getValue('_thumbnail_id')
		;

		if(!imageId)
			return me.openImageSelector();

		loading.render();
		target.parent().append(loading.$el);
		me.getImageInfo(me.post).done(function(imageInfo){
			loading.$el.remove();
			me.openImageEditor(false, imageInfo, me.post.id);
		});
	},

	getImageInfo: function(post){
		var me = this,
		imageData = post.meta.get('_thumbnail_data'),
		imageId = post.meta.get('_thumbnail_id'),
		deferred = $.Deferred(),
		$img = this.$('.ueditor_thumb').find('img')
		;

		if(!imageData || !_.isObject(imageData.get('meta_value')) || imageData.get('meta_value').imageId != imageId.get('meta_value')){
			if(!imageId)
				return false;
			Upfront.Views.Editor.ImageEditor.getImageData([imageId.get('meta_value')]).done(function(response){
				var images = response.data.images,
				sizes = {},
				imageId = 0
				;
				_.each(images, function(image, id){
					sizes = image;
					imageId = id;
				});

				deferred.resolve({
					src: sizes.medium ? sizes.medium[0] : sizes.full[0],
					srcFull: sizes.full[0],
					srcOriginal: sizes.full[0],
					fullSize: {width: sizes.full[1], height: sizes.full[2]},
					size: {width: $img.width(), height: $img.height()},
					position: {top: 0, left: 0},
					rotation: 0,
					id: imageId
				});
			});
		}
		else {
			var data = imageData.get('meta_value'),
			factor = $img.width() / data.cropSize.width
			;
			deferred.resolve({
				src: data.src,
				srcFull: data.srcFull,
				srcOriginal: data.srcOriginal,
				fullSize: data.fullSize,
				size: {width: data.imageSize.width * factor, height: data.imageSize.height * factor},//data.imageSize,
				position: {top: data.imageOffset.top * factor, left: data.imageOffset.left * factor},//data.imageOffset,
				rotation: data.rotation,
				id: data.imageId
			});
		}
		return deferred.promise();
	},

	openImageSelector: function(postId){
		var me = this;
		Upfront.Views.Editor.ImageSelector.open().done(function(images){
			var sizes = {},
			imageId = 0
			;
			_.each(images, function(image, id){
				sizes = image;
				imageId = id;
			});
			var imageInfo = {
				src: sizes.medium ? sizes.medium[0] : sizes.full[0],
				srcFull: sizes.full[0],
				srcOriginal: sizes.full[0],
				fullSize: {width: sizes.full[1], height: sizes.full[2]},
				size: sizes.medium ? {width: sizes.medium[1], height: sizes.medium[2]} : {width: sizes.full[1], height: sizes.full[2]},
				position: false,
				rotation: 0,
				id: imageId
			}
			;
			$('<img>').attr('src', imageInfo.srcFull).load(function(){
				Upfront.Views.Editor.ImageSelector.close();
				me.openImageEditor(true, imageInfo, postId);
			});
		});
	},

	openImageEditor: function(newImage, imageInfo, postId){
		var me = this,
		mask = this.$('.ueditor_thumb'),
		editorOptions = _.extend({}, imageInfo, {
			maskOffset: mask.offset(),
			maskSize: {width: mask.width(), height: mask.height()},
			setImageSize: newImage,
			extraButtons: [
			{
				id: 'image-edit-button-swap',
				text: Upfront.Settings.l10n.global.content.swap_image,
				callback: function(e, editor){
					editor.cancel();
					me.openImageSelector(postId);
				}
			}
			]
		})
		;

		Upfront.Views.Editor.ImageEditor.open(editorOptions).done(function(imageData){
			var post = me.post,
			img = mask.find('img'),
			newimg = $('<img style="z-index:2;position:relative">')
			;

			me.post.meta.add([
				{meta_key: '_thumbnail_id', meta_value: imageData.imageId},
				{meta_key: '_thumbnail_data', meta_value: imageData}
				], {merge: true});
			//post.meta.save();
			if(!img.length)
				img = newimg.appendTo(mask);
			else{
				img.replaceWith(newimg);
				img = newimg;
			}

			img.attr('src', imageData.src);
		});
	},

	focus: function(el, selectAll){
		var marker = 'upfront-content-marker-';
		if(typeof el.length == 'undefined')
			el = $(el);

		if(el.hasClass(marker + 'title') || el.hasClass(marker + 'contents')){
			el.get(0).focus();
			this.setSelection(el[0], selectAll);
		}
	},

	changeAuthor: function(authorId){
		var me = this,
			authorData = me.getAuthorData(authorId)
		;

		this.$('.upfront-content-marker-author').html(authorData.display_name);
		this.postAuthor = authorId;
	},

	editAuthor: function(e) {
		e.preventDefault();
		var target = $(e.target);

		this.authorSelect.open();

		this.authorSelect.$el.css({
			top: e.offsetY + 50,
			left: e.offsetX + target.width(),
			display: 'block'
		});
	},

	editDate: function(e) {
		e.preventDefault();
		var $target = $(e.target);
        console.log("editDate");
		if(this.datepicker.is(':visible')){
			// just update datepicker position
			this.datepicker.offset({
				top : $target.offset().top + 30,
				left : $target.offset().left + $target.width()
			});
		}

		var date = this.selectedDate || this.post.get('post_date');

	  /**
		* Show date picker
		*/
		this.datepicker.parent()
			.show()
			.offset({
				top : $target.offset().top + 30,
				left : $target.offset().left + $target.width()
			})
		;

		if(date){
			/**
			* update date in the date picker and the time picker
			*/

			var hours = date.getHours(),
				minutes = date.getMinutes()
			;
			this.datepicker.datepicker('setDate', date);

			this.$('.ueditor-hours-select').val(hours);
			this.$('.ueditor-minutes-select').val(minutes);
		}
	},

	getDateFormat: function(){
		return Upfront.Util.date.php_format_to_js(this.partOptions.date && this.partOptions.date.format ? this.partOptions.date.format : Upfront.data.date.format);
	},

	updateDateParts: function(date){
		this.parts.dates.html($.datepicker.formatDate(this.getDateFormat(), date));
	},

	editDateCancel : function(){
		// User has cancelled the date edition, restore previous date.
		this.updateDateParts(this.selectedDate || this.post.get('post_date'));
		this.$('.upfront-date_picker').hide();
	},

	editDateOk: function(){
		var chosen_date = this.datepicker.datepicker('getDate'),
			parent = this.datepicker.parent(),
			hours = parent.find(".ueditor-hours-select").val(),
			minutes = parent.find(".ueditor-minutes-select").val()
		;
		chosen_date.setHours( hours );
		chosen_date.setMinutes( minutes );

		this.dateOk(chosen_date);
		this.$('.upfront-date_picker').hide();
	},

	dateOk: function(date){
		this.selectedDate = date;
	},

	updateDateFromBar: function(date){
		this.updateDateParts(date);
		this.dateOk(date);
	},

	editTags: function(e){
		this.bar.editTaxonomies(e, 'post_tag');
	},

	editCategories: function(e){
		this.bar.editTaxonomies(e, 'category');
	},

	getAuthorData: function(authorId){
		var i = -1,
		found = false,
		authors = Upfront.data.ueditor.authors
		;

		while(++i < authors.length && !found){
			if(authors[i].ID == authorId)
				found = authors[i];
		}

		return found;
	},

	updateStatus: function(status){
		this.postStatus = status;
	},

	updateVisibility: function(visibility, password){
		this.postVisibility = visibility;
		this.postPassword = password;
	},

	// Thanks to http://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity/3866442#3866442
	setSelection: function(el, selectAll) {
		var range,selection;
		if(document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
		{
			range = document.createRange();//Create a range (a range is a like the selection but invisible)
			range.selectNodeContents(el);//Select the entire contents of the element with the range
			if(!selectAll)
				range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
			selection = window.getSelection();//get the selection object (allows you to change selection)
			selection.removeAllRanges();//remove any selections already made
			selection.addRange(range);//make the range you have just created the visible selection
		}
		else if(document.selection)//IE 8 and lower
		{
			range = document.body.createTextRange();//Create a range
			range.moveToElementText(el);//Select the entire contents of the element with the range
			if(!selectall)
			range.collapse(false);//collapse the range to the end point.
			range.select();//Select the range (make it the visible selection)
		}
	},

	titleEdited: function(e){
		var content = e.target.innerHTML;
		this.parts.titles.each(function(){
			if(this != e.target)
				this.innerHTML = content;
		});
	},

	contentEdited: function(e){
		var contents = e.currentTarget.innerHTML;
		this.parts.contents.each(function(){
			if(this != e.currentTarget)
				$(this).redactor('set', contents, false);
		});

		this.bar.calculateLimits();
		this.currentContent = e.currentTarget;
	},

	prepareBar: function(){
        var self = this;
		if(this.bar){
			this.bar.calculateLimits();
			return;
		}
		this.bar = new EditionBox({post: this.post});
		this.bindBarEvents();
		this.bar.render();
        this.$el.append(this.bar.$el);
        self.bar.setPosition();

		return;
	},

	bindBarEvents: function(){
		var me = this,
			events = ['cancel', 'publish', 'draft', 'trash']
		;
		_.each(events, function(e){
			me.listenTo(me.bar, e, function(){
				var results = {};
				if(e=='publish' || e=='draft'){
					//if(me.parts.titles) results.title = $.trim(me.parts.titles.html());
					if(me.parts.titles) results.title = $.trim(me.parts.titles.text());
					if(me.currentContent){
						var editor = $(me.currentContent).data('ueditor');
						results.content = $.trim(editor.getValue());
						results.inserts = editor.getInsertsData();
						results.author = me.postAuthor;
					}
					if(me.selectedDate)
						results.date = me.selectedDate;
					if(me.postStatus)
						results.status = me.postStatus;
					if(me.postVisibility)
						results.visibility = me.postVisibility;
					if(me.postPassword)
						results.pass = me.postPassword;
				}
				me.trigger(e, results);
			});
		});


		this
			.listenTo(me.bar, 'date:updated', me.updateDateFromBar)
			.listenTo(me.bar, 'date:cancel', me.editDateCancel)
			.listenTo(me.bar.statusSection, 'status:change', me.updateStatus)
			.listenTo(me.bar.visibilitySection , 'visibility:change', me.updateVisibility)
			.listenTo(me.bar, 'tax:refresh', me.refreshTaxonomies)
		;
	},

	refreshTaxonomies: function(){
		if(!this.parts.tags.length && !this.parts.categories.length)
			return;

		if(this.taxLoading)
			return;

		var me = this,
			options = this.postView.partOptions || {},
			templates = this.postView.partTemplates || {},
			request = {
				action: 'content_part_markup',
				post_id: this.post.get('ID'),
				parts: [],
				templates: {}
			}
		;

		if(this.parts.tags.length){
			request.parts.push({slug: 'tags', options: options.tags || {}});
			request.templates.tags = templates.tags || '';
		}

		if(this.parts.categories.length){
			request.parts.push({slug: 'categories', options: options.categories || {}});
			request.templates.categories = templates.categories || '';
		}

		request.parts = JSON.stringify(request.parts);

		// Wait a bit to finish storing any pending taxonomy
		setTimeout(function(){
			me.taxLoading = Upfront.Util.post(request).done(function(response){
				var partContents = me.postView.partContents;

				_.extend(partContents.replacements, response.data.replacements);
				_.extend(partContents.tpls, response.data.tpls);

				me.parts.tags.html(response.data.tpls.tags);
				me.parts.categories.html(response.data.tpls.categories);

				me.taxLoading = false;
			});
		}, 300);
	},

	stop: function(){
		Upfront.Events.off("upfront:element:edit:stop", this.element_stop_prop);

		if(this.onTitleEdited)
			this.parts.titles.off('change', this.onTitleEdited);

		if(this.editors)
			_.each(this.editors, function(e){e.stop()});

		var draggable = this.$el.closest('.ui-draggable');
		if(draggable.length)
			cancel = draggable.draggable('enable');

		this.$('a').data('bypass', false);
	},

	preventLinkNavigation: function(e){
		e.preventDefault();
	}
});

var PostSectionView = Backbone.View.extend({
    events:{
        'click .ueditor-btn-edit': 'toggleEditor',
        'click .ueditor-button-cancel': 'cancelEdit',
        "click .ueditor-button-ok-small" : "update",
        'change input[type="radio"][name="visibility"]': 'visibility_radio_change',
        "change input[name='visibility']" : "set_visibility"
    },
    toggleEditor: function(e){
        e.preventDefault();
        var $button = $(e.target),
            $this_togglable = $button.siblings(".ueditor-togglable"),
            $this_prev_data_toggle = $button.closest(".misc-pub-section").find(".ueditor-previous-data-toggle")
            ;
        $(".ueditor-box-content-wrap .ueditor-togglable").not($this_togglable).slideUp();
        $(".ueditor-box-content-wrap .ueditor-btn-edit").show();
        $(".ueditor-previous-data-toggle").not( $this_prev_data_toggle ).show();

        $this_prev_data_toggle.hide();
        $button.hide();
        $this_togglable.slideDown(100);
    },
    cancelEdit: function(e){
        e.preventDefault();
        var $button = $(e.target),
            $this_prev_data_toggle = $button.closest(".misc-pub-section").find(".ueditor-previous-data-toggle")
            ;
        $this_prev_data_toggle.show();
        $button.closest(".ueditor-togglable").slideUp(100, function(){
            $button.closest(".ueditor-togglable").siblings(".ueditor-btn-edit").show();
        });

    },
    visibility_radio_change: function(e){
        var $this = $(e.target),
            val = $this.val(),
            $this_togglable = $(".ueditor-togglable-child-" + val)
            ;
        $this.closest(".ueditor-togglable").find(".ueditor-togglable-child").not($this_togglable).hide();
        $this_togglable.show();
    }
});

var ContentEditorTaxonomy_Hierarchical = PostSectionView.extend({
    termListTpl : _.template($(editionBox_tpl).find('#upfront-term-list-tpl').html()),
    termSingleTpl : _.template($(editionBox_tpl).find('#upfront-term-single-tpl').html()),
    defaults: {
        title: "Categories"
    },
	className: "upfront-taxonomy-hierarchical",
	events: _.extend({},PostSectionView.prototype.events, this.events, {
        "click #upfront-add_term": "handle_new_term",
        "click #add-new-taxonomies-btn": "toggle_add_new",
        "keydown #upfront-add_term": "handle_enter_new_term",
        "change .upfront-taxonomy_item": "handle_terms_update",
        'keydown #upfront-new_term': 'handle_enter_new_term'
    }),
	updateTimer: false,
	allTerms: false,
	initialize: function(options){
		//this.collection.on('add remove', this.render, this);
	},

	render: function() {
        var self = this,
            selected_term_ids = self.collection.pluck("term_id"),
            all_terms =  this.allTerms.sortBy(function(term, indx) {
                return selected_term_ids.indexOf( term.get("term_id") ) !== -1;
            })
            ;

		this.$el.html(
			this.termListTpl(_.extend(this.defaults, {
                allTerms: this.allTerms.where({'parent': '0'}),
				postTerms: this.collection,
				termTemplate: this.termSingleTpl,
				labels: this.collection.taxonomyObject.labels
			}))
			);
	},

	handle_new_term: function() {
		var me = this,
		termId = this.$el.find("#upfront-new_term").val(),
		parentId, term
		;

		if(!termId)
			return false;

		if ($("#upfront-taxonomy-parents").length)
			parentId = $("#upfront-taxonomy-parents").val();

		term = new Upfront.Models.Term({
			taxonomy: this.collection.taxonomy,
			name: termId,
			parent: parentId
		});

		term.save().done(function(response){
			me.allTerms.add(term);
			me.collection.add(term).save();
			me.render();
		});
	},

	handle_terms_update: function(e){
		var me = this,
		$target = $(e.target),
		termId = $target.val()
		;

		if(!$target.is(':checked')){
			this.collection.remove(this.allTerms.get(termId));
		}
		else
			this.collection.add(this.allTerms.get(termId));

		//Delay the current update to let the user add/remove more terms
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function(){
			me.collection.save();
		}, 2000);
	},

	handle_enter_new_term: function (e) {
		if(e.which == 13){
			this.handle_new_term(e);
		}
	},
    toggle_add_new: function(){
        this.$(".ueditor-togglable-child").slideToggle();
    }
});

var ContentEditorTaxonomy_Flat = Backbone.View.extend({
	"className": "upfront-taxonomy-flat",
	termListTpl: _.template($(editionBox_tpl).find('#upfront-flat-term-list-tpl').html()),
	termSingleTpl: _.template($(editionBox_tpl).find('#upfront-term-flat-single-tpl').html()),
	changed: false,
	updateTimer: false,
	events: {
		"click #upfront-add_term": "handle_new_term",
		'click .upfront-taxonomy_item-flat': 'handle_term_click',
		'keydown #upfront-add_term': 'handle_enter_new_term',
		'keydown #upfront-new_term': 'handle_enter_new_term'
	},
	initialize: function(options){
		this.collection.on('add remove', this.render, this);
	},
	render: function () {
		var	me = this,
		currentTerms = [],
		otherTerms = []
		;
		this.allTerms.each(function (term, idx) {
			term.children = [];
			if(me.collection.get(term.get('term_id')))
				currentTerms.push(term);
			else
				otherTerms.push(term);
		});

		this.$el.html(this.termListTpl({
			currentTerms: currentTerms,
			otherTerms: otherTerms,
			termTemplate: this.termSingleTpl,
			labels: this.collection.taxonomyObject.labels
		}));
	},

	handle_term_click: function(e){
		var me = this,
		$target = $(e.currentTarget),
		termId = $target.attr('data-term_id');

		if($target.parent().attr('id') == 'upfront-taxonomy-list-current')
			this.collection.remove(termId);
		else
			this.collection.add(this.allTerms.get(termId));

	//Delay the current update to let the user add/remove more terms
	clearTimeout(this.updateTimer);
	this.updateTimer = setTimeout(function(){
		me.collection.save();
	}, 2000);
},

handle_new_term: function (e) {
	var me = this,
	termId = this.$el.find("#upfront-new_term").val(),
	term
	;

	e.preventDefault();

	if(! termId)
		return false;

	term = new Upfront.Models.Term({
		taxonomy: this.collection.taxonomy,
		name: termId
	});

	term.save().done(function(response){
		me.allTerms.add(term);
		me.collection.add(term).save();
	});
},

handle_enter_new_term: function (e) {
	if(e.which == 13){
		this.handle_new_term(e);
	}
}
});

var MicroSelect = Backbone.View.extend({
	tpl: false,
	className: 'ueditor-select ueditor-popup upfront-ui',
	events: {
		'blur input': 'close',
		'click .ueditor-select-option': 'select'
	},
	initialize: function(options){
		this.opts = options.options;
		this.render();
	},
	render: function() {
		if(!this.tpl)
			this.tpl = this.getTpl();
		if(this.tpl)
			this.$el.html(this.tpl({options: this.opts}));
	},
	open: function(){
		var me = this;
		if(!this.tpl)
			this.render();
		this.$el.css('display', 'inline-block');
		this.delegateEvents();
		$(document).one('click', function(e){
			var parent = me.$el.parent().length ? me.$el.parent() : me.$el,
			$target = $(e.target)
			;
			if(!$target.is(parent[0]) && !$target.closest(parent[0]).length)
				me.close();
		});
	},
	close: function(e){
		var me = this;
		setTimeout(function(){
			me.$el.hide();
		}, 200);
	},
	select: function(e){
		e.preventDefault();
		var value = $(e.target).data('id');
		this.trigger('select', value);
		this.$('input').val('value');
		this.$el.hide();
	},
	getTpl: function(){
		if(this.tpl)
			return this.tpl;

		if(Upfront.data && Upfront.data.tpls)
			return _.template($(Upfront.data.tpls.popup).find('#microselect-tpl').html());
		return false;
	}
});

var EditionBox = Backbone.View.extend({
        className: 'ueditor-box-wrapper upfront-ui',
        post: false,

        offset: {min:0, max:0},
        position: {min:0, max:0},

        onScrollFunction: false,

        statusSelect: false,
        visibilitySelect: false,



        events: {
            'click .ueditor-action-preview': 'navigate_to_preview',
            'click .ueditor-action-cancel': 'cancel',
            'click .ueditor-action-publish': 'publish',
            'click .ueditor-action-draft': 'saveDraft',
            'click .ueditor-action-trash': 'trash',
            'click .ueditor-action-tags': 'editTaxonomies',
            'click .ueditor-action-schedule': 'openDatepicker',
            'click .ueditor-action-pickercancel': 'close_date_picker',
            'click .ueditor-action-pickerok': 'save_date_picker',
            'click .ueditor-box-title': 'toggle_section',
            'click .ueditor-save-post-data': 'save_post_data'
        },

        initialize: function(options){
            var me = this;
            this.post = options.post;


            this.statusSection = new PostStatusView({post: this.post});
            this.visibilitySection = new PostVisibilityView({post: this.post});
            this.scheduleSection = new PostScheduleView({post: this.post});
            this.urlEditor = new PostUrlEditor( { post: this.post } );

            this.tpl = _.template($(editionBox_tpl).find("#ueditor-box-main").html());
            this.datepickerTpl = _.template($(Upfront.data.tpls.popup).find('#datepicker-tpl').html());
            Upfront.Events.trigger('upfront:element:edit:start', 'write', this.post);

            Upfront.Events.on("upfront:element:edit:stop", this.element_stop_prop, this);
        },

        element_stop_prop: function () {
            if (
                Upfront.Application.mode.current === Upfront.Application.MODE.POSTCONTENT
                &&
                Upfront.Application.current_subapplication.contentEditor
            ) $('.upfront-module').draggable('disable').resizable('disable');
        },

        render: function(){
            this.destroy();
            if (!Upfront.Settings.Application.MODE.ALLOW.match(Upfront.Settings.Application.MODE.CONTENT)) return false; // Drop the entire bar rendering if we're unable to deal with it
            var me = this,
                postData = this.post.toJSON(),
                date = this.post.get('post_date'),
                datepickerData = {},
                extraData = {},
                base = me.post.get("guid")
                ;


            extraData.rootUrl = base ? base.replace(/\?.*$/, '') : window.location.origin + '/';
            postData.permalink = this.permalink = extraData.rootUrl + this.post.get("post_name");

            //postData.schedule = this.getSchedule();

            postData.buttonText = this.getButtonText();
            postData.draftButton = ['publish', 'future'].indexOf(this.initialStatus) == -1;
            postData.cancelButton = !(this.post.is_new);

            postData.cid = this.cid;

            datepickerData.minutes = _.range(0,60);
            datepickerData.hours = _.range(0,24);

            datepickerData.currentHour = date.getHours();
            datepickerData.currentMinute = date.getHours();

            postData.datepicker = this.datepickerTpl(datepickerData);


            this.$el.html(this.tpl(_.extend(postData, datepickerData, extraData) ));

            this.renderTaxonomyEditor( this.$(".misc-pub-post-category"), "category");
            this.renderTaxonomyEditor( this.$(".misc-pub-post-tags .ueditor-subview"), "post_tag");

            this.$('.upfront-bar-datepicker').datepicker({
                changeMonth: true,
                changeYear: true,
                dateFormat: 'yy/mm/dd',
                onChangeMonthYear: function(year, month){
                    var picker = me.$('.upfront-bar-datepicker'),
                        day = picker.datepicker('getDate').getDate();
                    ;
                    var prev_date = new Date(  me.$('.ueditor-action-schedule').text()  ),
                        d = new Date ( year, month - 1, day, prev_date.getHours(), prev_date.getMinutes() )
                        ;

                    me.$('.ueditor-action-schedule').html(Upfront.Util.format_date( d, true));
                    me.post.set("post_date", d);
                    picker.datepicker("setDate", d);
                },
                onSelect: function(textDate){
                    me.updateBarDate(me.getDatepickerDate());
                }
            });


            this.populateSections();

            //if($('#' + this.cid).length)
            //    this.stick();
        },
        navigate_to_preview: function(e){
            e.preventDefault();
            window.open(this.permalink, '_blank');
        },
        renderTaxonomyEditor: function($el, tax){
            var self = this,
                tax = typeof tax === "undefined" ? "category" : tax,
                termsList = new Upfront.Collections.TermList([], {postId: this.post.id, taxonomy: tax});
            termsList.fetch({allTerms: true}).done(function(response){
                var tax_view_constructor = response.data.taxonomy.hierarchical ? ContentEditorTaxonomy_Hierarchical : ContentEditorTaxonomy_Flat,
                    tax_view = new tax_view_constructor({collection: termsList})
                    ;

                tax_view.allTerms = new Upfront.Collections.TermList(response.data.allTerms);
                tax_view.render();
                $el.html( tax_view.$el );
            });

        },
        populateSections: function(){
            this.$('.misc-pub-post-status').html(this.statusSection.$el);
            this.$('.misc-pub-visibility').html(this.visibilitySection.$el);
            this.$('.misc-pub-schedule').html(this.scheduleSection.$el);


            this.$(".misc-pub-section.misc-pub-post-url").html( this.urlEditor.$el  );
        },

        openDatepicker: function(e){
            var date = this.initialDate;

            this.$('.upfront-date_picker').toggle();

            if(date)
                this.$('.ueditor-action-schedule').html(Upfront.Util.format_date(date, true));
        },

        close_date_picker : function(){
            this.trigger('date:cancel');
            this.updateBarDate(this.initialDate);
            this.$('.upfront-date_picker').hide();
        },

        save_date_picker : function(){
            var date = this.getDatepickerDate();

            this.initialDate = date;

            this.trigger('date:updated', date);
            this.$('.upfront-date_picker').hide();
            this.render();
            this.toggleAdvanced();
        },


        updateBarDate: function(date){
            this.$('.ueditor-action-schedule').html(Upfront.Util.format_date(date, true));
        },

        getDatepickerDate: function(){
            var chosen_date = this.$('.upfront-bar-datepicker').datepicker('getDate'),
                hours = this.$(".ueditor-hours-select").val(),
                minutes = this.$(".ueditor-minutes-select").val()
                ;
            chosen_date.setHours( hours );
            chosen_date.setMinutes( minutes );

            return chosen_date;
        },
        getButtonText: function(){
            var initial = this.initialStatus,
                date = this.post.get('post_date'),
                now = new Date()
                ;

            date = date ? date.getTime() : 0;
            now = now.getTime();

            if(now < date) {
                if(initial == 'future')
                    return Upfront.Settings.l10n.global.content.update;
                return Upfront.Settings.l10n.global.content.schedule;
            }
            else {
                if(initial == 'publish')
                    return Upfront.Settings.l10n.global.content.update;
                return Upfront.Settings.l10n.global.content.publish;
            }
        },

        calculateLimits: function(){
            var ph = this.$('.ueditor-bar-ph'),
                container = this.$el.parent()
                ;
            if (!container.length) return false;

            var height = container.height();
            if(height == this.containerHeight)
                return;

            var offset = container.offset().top;

            this.position = {
                min: 100,
                max: height
            };

            this.offset ={
                min: this.position.min + offset,
                max: this.position.max + offset + 2 * this.$el.height()
            };
        },

        setPosition: function(){
            var $container = this.$el.closest(".upfront-output-this_post"),
                $content_part = $(".upfront-postpart-contents"),
                right_space = $("body").width() - ( $container.width() + $container.offset().left ),
                right = right_space > this.$el.width() ? right_space - this.$el.width() :  10
                ;

            this.$el.css({
                right: right + 10
            });

        },

        destroy: function(){
            //$(window)
            //    .off('scroll', this.onScrollFunction)
            //    .off('resize', this.onScrollFunction)
            //;
            //this.onScrollFunction = false;
        },

        cancel: function(e){
            e.preventDefault();
            if(confirm(Upfront.Settings.l10n.global.content.discard_changes.replace(/%s/, this.post.get('post_title')))){
                this.destroy();
                this.post.trigger('editor:cancel');
                this.trigger('cancel');
                Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
            }
        },

        publish: function(e){
            /*
             if(this.currentStatus == 'draft') return this.saveDraft(e); // Why? This is just asking for problems...
             */

            e.preventDefault();
            //this.destroy();

            this.post.trigger('editor:publish');
            this.trigger('publish');
            Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
        },

        saveDraft: function(e){
            e.preventDefault();

            this.destroy();

            this.post.trigger('editor:draft');
            this.trigger('draft');
            Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
        },

        trash: function(e){
            e.preventDefault();
            if(confirm( Upfront.Settings.l10n.global.content.delete_confirm.replace(/%s/, this.post.get('post_type')))){
                this.destroy();
                this.trigger('trash');
                Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
            }
        },

        editTaxonomies: function(e, taxName){
            if(e)
                e.preventDefault();

            var me = this,
                tmp = $('body').append('<div id="upfront-post_taxonomies" style="display:none" />'),
                $tax = $("#upfront-post_taxonomies"),
                $popup = {},
                views = {category: false, post_tag: false},
                currentView = taxName || 'category',
                terms = {},
                popup = Upfront.Popup.open(function (data, $top, $bottom) {
                    var $me = $(this);
                    $me.empty()
                        .append('<p class="upfront-popup-placeholder">' + Upfront.Settings.l10n.global.content.popup_loading + '</p>')
                        .append($tax)
                    ;
                    $popup = {
                        "top": $top,
                        "content": $me,
                        "bottom": $bottom
                    };
                }),
                dispatch_taxonomy_call = function (el) {
                    var $el = $(el),
                        tax = $el.attr("data-type"),
                        type = $el.attr('rel'),
                        termsList = terms[tax] ? terms[tax] : false
                        ;
                    $popup.top.find('.upfront-tabs li').removeClass('active');
                    $el.addClass('active');

                    currentView = tax;

                    if(views[tax])
                        return render_panel(views[tax]);

                    if(!termsList){
                        termsList = new Upfront.Collections.TermList([], {postId: me.post.id, taxonomy: tax});
                        terms[tax] = termsList;
                    }

                    $popup.content.html('<p class="upfront-popup-placeholder">' + Upfront.Settings.l10n.global.content.popup_loading + '</p>');

                    termsList.fetch({allTerms: true}).done(function(response){
                        var tax_view_constructor = response.data.taxonomy.hierarchical ? ContentEditorTaxonomy_Hierarchical : ContentEditorTaxonomy_Flat,
                            tax_view = new tax_view_constructor({collection: termsList})
                            ;

                        tax_view.allTerms = new Upfront.Collections.TermList(response.data.allTerms);

                        views[tax] = tax_view;
                        render_panel();
                    });

                    me.listenToOnce(Upfront.Events, 'popup:closed', me.refreshTaxonomies);

                    return false;
                },
                render_panel = function(view){
                    var v = views[currentView];
                    v.render();
                    $popup.content.html(v.$el);
                    v.setElement(v.$el);
                }
                ;

            $(".upfront-popup-placeholder").remove();
            $popup.top.html(
                '<ul class="upfront-tabs">' +
                '<li data-type="category" class="tax-category">' + Upfront.Settings.l10n.global.content.categories + '</li>' +
                '<li data-type="post_tag" class="tax-post_tag">' + Upfront.Settings.l10n.global.content.tags + '</li>' +
                '</ul>' +
                $popup.top.html()
            );

            $popup.top.find('.upfront-tabs li').on("click", function () {
                dispatch_taxonomy_call(this);
            });

            $tax.show();

            dispatch_taxonomy_call($popup.top.find('.tax-' + currentView));

            Upfront.Events.on("upfront:post:taxonomy_changed", function () {
                dispatch_taxonomy_call($popup.top.find('.upfront-tabs li.active'));
            });
        },

        refreshTaxonomies: function(){
            this.trigger('tax:refresh');
        },
        toggle_section: function(e){
            e.preventDefault();
            var $this = $(e.target),
                $this_section = $this.closest(".ueditor-box-section"),
                $this_wrap = $this_section.find(".ueditor-box-content-wrap")
            ;
            //
            //$(".ueditor-box-section").not( $this_section).removeClass("active");
            //$(".ueditor-box-content-wrap").not( $this_wrap ).slideUp();

            $this_section.toggleClass("active");
            $this_wrap.slideToggle();
        }
    });



var PostUrlEditor = PostSectionView.extend({
    className: "upfront-slug_editor-url",
    tpl : _.template($(editionBox_tpl).find("#post-url-editor").html()),
    initialize: function(opts){
        this.post = opts.post;
        this.render();
    },
    render: function(){
        var self = this,
            base = this.post.get("guid");
        base = base ? base.replace(/\?.*$/, '') : window.location.origin + '/';
        this.$el.html(this.tpl({
            rootUrl: base,
            slug: self.post.get('post_name')
        }));
    },
    save: function(e){
        e.preventDefault();
        var val = this.$(".ueditor-post-url-text").val();
        if( val.length > 1 ){
            this.post.set( "post_name", val );
            this.render();
        }
    }
});

var PostStatusView = PostSectionView.extend({
    statusOptions: {
        future: {value:'future', name: Upfront.Settings.l10n.global.content.scheduled},
        publish: {value: 'publish', name: Upfront.Settings.l10n.global.content.published},
        pending: {value: 'pending', name: Upfront.Settings.l10n.global.content.pending_review},
        draft: {value: 'draft', name: Upfront.Settings.l10n.global.content.draft},
        'private': {value: 'private', name: Upfront.Settings.l10n.global.content.private_post},
        'auto-draft': {value: 'auto-draft', name: Upfront.Settings.l10n.global.content.new_post},
        'trash': {value: 'trash', name: Upfront.Settings.l10n.global.content.deleted_post}
    },
    initialStatus: false,
    tpl: _.template($(editionBox_tpl).find('#post-status-tpl').html()),
    initialize: function(options){
        this.post = options.post;
        this.render();
    },
    render: function(){
        this.initialStatus = this.currentStatus = this.post.get("post_status");
        this.status = this.getStatus();
        this.options = this.getStatusOptions();
        this.$el.html( this.tpl(_.extend( this.post, {status: this.status}, {options: this.options} )) );
        return this;
    },
    getStatusOptions: function(postata){
        var ops = [],
            status = this.initialStatus
            ;

        if(status == 'publish'){
            ops.push(this.statusOptions.publish);
        }
        else if(status == 'future'){
            ops.push(this.statusOptions.future);
        }
        ops.push(this.statusOptions.pending);
        ops.push(this.statusOptions.draft);

        if(status == 'private'){
            ops = [ this.statusOptions.private ];
        }

        return ops;
    },
    getStatus: function(){
        var current = this.post.get("post_status");
        if(['auto-draft', 'draft', 'pending'].indexOf(current) != -1)
            return this.statusOptions[current];
        return this.statusOptions[this.initialStatus];
    },
    update: function(e){
        e.preventDefault();
        var status = this.$("select").val();
        if(!_.isEmpty( status ) && status !== this.initialStatus ){
            this.post.set("post_status", status);
            this.trigger("status:change", status);
            this.render();
        }
    }

});

var PostVisibilityView = PostSectionView.extend({
    tpl: _.template($(editionBox_tpl).find('#post-visibility-tpl').html()),
    post_password: "",
    postVisibility: false,
    visibilityOptions: {
        'public': {value: 'public', name:Upfront.Settings.l10n.global.content.public_post},
        'sticky': {value: 'sticky', name:Upfront.Settings.l10n.global.content.sticky},
        'password': {value: 'password', name: Upfront.Settings.l10n.global.content.protected_post},
        'private': {value: 'private', name: Upfront.Settings.l10n.global.content.is_private}
    },
    initialize: function(opts){
        this.post = opts.post;
        this.render();
    },
    render: function(){
        this.postVisibility = !this.postVisibility ? this.post.getVisibility() : this.postVisibility;
        this.status = this.visibilityOptions[ this.postVisibility ];
        if(this.postVisibility == 'password')
            this.post_password = this.post.get('post_password');

        this.$el.html( this.tpl(_.extend({}, this.post, {status : this.status, post_password: this.post_password} ) ) );
        return this;
    },
    getVisibilityOptions: function(){
        var now = this.post.getVisibility(),
            ops = this.visibilityOptions
            ;
        if(now == 'password')
            return [
                {value: 'password', name: Upfront.Settings.l10n.global.content.edit_pwd},
                ops.public,
                ops.sticky,
                ops.private
            ]
                ;
        return _.values(ops);
    },
    set_visibility: function(e){
        var visibility_status = $(e.target).val();
        this.postVisibility = visibility_status;
    },
    update: function(){
        var $pass = this.$(".ueditor-post-pass"),
            pass = $pass.val();
        this.postVisibility = this.$("input[name='sticky']").is(":checked") ? this.postVisibility = "sticky" : this.postVisibility;

        if( !this.visibilityOptions.hasOwnProperty( this.postVisibility ) ) return;

        switch ( this.postVisibility ){
            case "password":
                if( pass !== ""  ){
                    $pass.css("border", "1px solid #a3bfd9");
                    this.post.setVisibility(this.postVisibility);
                    this.post.set("post_password", pass);
                    this.trigger("visibility:change", "password", pass);
                }else{
                    $pass.css("border", "1px solid red");
                    return;
                }
                break;
            default:
                this.post.setVisibility(this.postVisibility);

                this.trigger("visibility:change", this.postVisibility, "");
            break;
        }

        this.render();
    }
});

var PostScheduleView = PostSectionView.extend({
    tpl: _.template($(editionBox_tpl).find('#post-schedule-tpl').html()),
    initialize: function(options){
        this.post = options.post;
        this.render();
    },
    render: function(){
        var date = new Object();
        this.initialDate = this.post.get("post_date");
        date.currentMonth = this.initialDate.getMonth();
        date.currentYear = this.initialDate.getFullYear();
        date.currentDay = this.initialDate.getDate();
        date.currentHour = this.initialDate.getHours();
        date.currentMinute = this.initialDate.getMinutes();
        this.schedule = this.getSchedule();
        this.$el.html( this.tpl(_.extend( {}, this.post, date, {schedule: this.schedule }) ) );
        return this;
    },
    getSchedule: function(){
        var now = new Date(),
            date = this.initialDate,
            formatDate = Upfront.Util.format_date
            ;
        if(!date && !this.initialDate)
            return {
                key: Upfront.Settings.l10n.global.content.publish,
                text: Upfront.Settings.l10n.global.content.immediately
            };

        if(date.getTime() == this.initialDate){
            if(date.getTime() < now.getTime())
                return {
                    key: Upfront.Settings.l10n.global.content.published,
                    text: formatDate(date, true)
                };
            else
                return {
                    key: Upfront.Settings.l10n.global.content.scheduled,
                    text: formatDate(date, true)
                };
        }

        if(date.getTime() < now.getTime())
            return {
                key: Upfront.Settings.l10n.global.content.publish_on,
                text: formatDate(date, true)
            };
        else
            return {
                key: Upfront.Settings.l10n.global.content.scheduled_for,
                text: formatDate(date, true)
            };
    },
    update: function(){
        var date = new Date(),
            year = this.$("input[name='yy']").val(),
            month = this.$("select[name='mm']").val(),
            day = this.$("input[name='jj']").val(),
            hour = this.$("input[name='hh']").val(),
            minute = this.$("input[name='mn']").val()
        ;
        date.setFullYear(year);
        date.setMonth(month);
        date.setDate(day);
        date.setHours(hour);
        date.setMinutes(minute);
        this.post.set("post_date", date);
        this.render();
    }

});

return {
	PostContentEditor: PostContentEditor,
	getMarkupper: function getMarkupper(){return markupper;}
}


//End define
});})(jQuery);
