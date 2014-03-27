;(function ($, undefined) {
define(function() {

	var SimpleEditor = Backbone.View.extend({
		initialize: function(options){
			console.log('SimpleEditor Deprecated');
		},

		start: function() {
			console.log('SimpleEditor Deprecated');
		},

		stop: function(){
			console.log('SimpleEditor Deprecated');
		}
	});

	var Editor_Meta = Backbone.View.extend({
		events: {
			'dblclick .ueditor_content': 'editContent',
			'click .upost_thumbnail_changer': 'editThumb',
			'click .ueditor_title': 'editTitle',
			'click .ueditor_restore': 'restore',
			'click .ueditor_date': 'editDate',
			'click .ueditor-action-pickercancel': 'cancelDatepicker',
			'click .ueditor-action-pickerok': 'changeDate',
			'click .ueditor_author': 'editAuthor',
			'click .ueditor_content': 'activateEditor'
		},

		/**
		 * Options to create a meta editor are:
		 * 		post_id: to fetch and update the post
		 *   	preload: when to fetch the post in the initialization of the editor or wait until trying to edit
		 * 		node: the HTML node to be this.$el
		 * 		content_mode: post_excerpt || post_content
		 * @param  {[type]} options [description]
		 * @return {[type]}         [description]
		 */
		initialize: function(options){
			this.setDefaults();

			this.postId = options.post_id;
			this.setElement(options.node);

			console.log('Content editor init');

			this.autostart = options.autostart || false;

			//If the post is in the cache, prepare it!
			if(Upfront.data.posts[this.postId]){
				this.post = Upfront.data.posts[this.postId];
				this.loadingPost = new $.Deferred();
				this.loadingPost.resolve(this.post);
				//this.bindPostEvents();
			}

			if(options.preload)
				this.getPost();

			this.backup = this.$el.html();

			if(typeof options.content_mode != 'undefined')
				this.mode = options.content_mode;

			this.datepickerTpl = _.template($(Upfront.data.tpls.popup).find('#datepicker-tpl').html());
			this.initEditAreas();


		},

		setDefaults: function(){
			this.post = false;
			this.postId = false;
			this.loadingPost = false;
			this.isNew = false;
			this.mode = 'post_excerpt';
			this.view = false;
			this.bar = false;
			this.backup = false;
			this.changed = {
				title: false,
				thumb: false,
				content: false
			}
		},

		bindPostEvents: function(){
			this.bar.on('editor:cancel', this.cancelChanges, this);
			this.bar.on('editor:publish', this.publish, this);
			this.bar.on('editor:draft', this.saveDraft, this);
			this.bar.on('editor:trash', this.trash, this);
		},

		/**
		 * Update view's element. Useful when updating the markup.
		 */
		updateElement: function(node){
			if(this.el == node[0])
				return;
			this.setElement(node);
			this.initEditAreas();

			if (this.cke && this.cke.destroy){
				this.cke.destroy();
				this.cke = false;
			}

			if(this.bar){
				this.bar = false;
			}

			this.backup = this.$el.html();
		},

		initEditAreas: function(){
			var me = this,
				selectors = Upfront.data.ueditor.selectors;
			_.each(selectors, function(s){
                var area = s.type;
                var selector = s.selector;
				if(area == 'content' || area == 'excerpt'){
					me.prepareContentEditor(selector);
				}
				else if(area == 'title'){
					me.prepareTitleEditor(selector);
				}
				else if(area == 'thumbnail'){
					me.prepareThumbEditor(selector);
				}
				else if(area == 'date'){
					me.prepareDateEditor(selector);
				}
				else if(area == 'author'){
					me.prepareAuthorEditor(selector);
				}
			});

			//Prevent dragging from editable areas
			var draggable = this.$el.closest('.ui-draggable'),
				cancel = draggable.draggable('option', 'cancel')
			;
			if(_.isString(cancel) && cancel.indexOf('.ueditable') == -1){
				draggable.draggable('option', 'cancel', cancel + ',.ueditable');
				console.log('Editable areas no draggable anymore.');
			}
		},

		fetchPost: function(){
			var me = this;
			this.post = new Upfront.Models.Post({ID: this.postId});

			//this.bindPostEvents();

			this.loadingPost = new $.Deferred();
			this.post.fetch({withMeta: true, filterContent: true}).done(function(response){
				if(!Upfront.data.posts)
					Upfront.data.posts = {};
				Upfront.data.posts[me.postId] = me.post;
				me.loadingPost.resolve(me.post);
			});
			return this.loadingPost.promise();
		},

		getPost: function(){
			if(this.post || this.loadingPost)
				return this.loadingPost.promise();

			return this.fetchPost();
		},

		prepareContentEditor: function(selector){
			var element = this.$(selector);
			if(!element.length || element.data('ueditor'))
				return;

			element.addClass('ueditor_content ueditable');
			if(this.autostart)
				this.editPost('.ueditor_content', this.mode, true);

			console.log('Content editor prepared.');
		},

		prepareTitleEditor: function(selector){
			var me = this,
				element = this.$(selector)
			;
			if(!element.length || element.data('ueditor'))
				return;

			element
				.addClass('ueditor_title ueditable')
				.on('start', function(editor){
					me.changed.title = element;
					me.getPost().done(function(post){
						//We will need the edition bar
						me.prepareBar();
					});
					setTimeout(function(){
						element.ueditor('selectionAll');
					}, 200);

					//Once started, don't disable when click out
					editor.disableStop = true;
				})
				.on('keydown', function(e){
					if(e.which == 9 || e.which == 13){ // tab or enter
						e.preventDefault();
						me.$('.ueditor_content').focus();
						me.$('.ueditor_excerpt').focus();
					}
				})
				.ueditor({
					airButtons: {},
					observeLinks: false,
					autostart: this.autostart,
					tabFocus: false,
					placeholder: 'Write a title...'
				})
				.on('click', function(e){e.preventDefault();})
			;

			this.titleEditor = element.data('ueditor');
		},

		prepareThumbEditor: function(selector){
			var selector = this.$(selector);
			if(!selector.length || selector.hasClass('ueditable'))
				return;

			selector.addClass('ueditor_thumb ueditable')
				.css({position:'relative', 'min-height': '60px'})
				.append('<div class="upost_thumbnail_changer">Click to edit the post\'s featured image</div>')
				.find('img').css({'z-index': '2', position: 'relative'})
			;
		},

		prepareDateEditor: function(selector){
			var me = this,
				datepickerData = {}
			;

			if(this.$(selector).find('.upfront-bar-datepicker').length)
				return;

			datepickerData.minutes = _.range(0,60);
			datepickerData.hours = _.range(0,24);

			datepickerData.currentHour = 1;
			datepickerData.currentMinute = 1;

			//$("#ui-datepicker-div").addClass('upfront-date_picker upfront-ui');
			this.$(selector)
				.addClass('ueditor_date ueditable')
				.append(me.datepickerTpl(datepickerData))
				.find('.upfront-bar-datepicker')
					.datepicker({
						changeMonth: true,
						changeYear: true,
						dateFormat: 'yy-mm-dd',
						onChangeMonthYear: function(year, month){
							var picker = me.$('.upfront-bar-datepicker'),
								day = picker.datepicker('getDate').getDate()
							;
							day = day < 10 ? '0' + day : day;
							month = month < 10 ? '0' + month : month;

							me.$('.upfront-bar-datepicker').datepicker('setDate', year + '-' + month + '-' + day);
						}
					})
			;

		},

		prepareAuthorEditor: function(selector){
			if(this.$(selector).find('.ueditor-select').length)
				return;

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

			this.$(selector)
				.addClass('ueditor_author ueditable')
				.append(this.authorSelect.$el)
			;
		},


		prepareBar: function(){
			if(this.bar){
				this.bar.calculateLimits();
				return;
			}

			this.bar = new EditionBar({post: this.post});
			this.bindPostEvents();
			this.bar.render();
			this.$el.append(this.bar.$el);
			this.bar.stick();

			return;
		},

		editTitle: function(e){
			var me = this;

			if(e)
				e.preventDefault();

			//Fetch the post
			this.getPost().done(function(post){
				//We will need the edition bar
				me.prepareBar();
			});

			this.$('.ueditor_title').focus();
		},

		editThumb: function(e){
			e.preventDefault();
			var me = this,
				target = $(e.target),
				postId = this.postId,
				img = target.parent().find('img'),
				loading = new Upfront.Views.Editor.Loading({
					loading: "Starting image editor ...",
					done: "Here we are!",
					fixed: false
				})
			;

			//Fetch the post
			this.getPost().done(function(post){
				//We will need the edition bar
				me.prepareBar();
			});

			if(!img.length){
				me.openImageSelector(postId);
			}
			else{
				loading.render();
				target.parent().append(loading.$el);
				this.getPost().done(function(response){
					me.getImageInfo(me.post).done(function(imageInfo){
						loading.$el.remove();
						me.openImageEditor(false, imageInfo, postId);
					});
				});
			}
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
				var	imageInfo = {
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

		openImageEditor: function(newImage, imageInfo, postId){
			var me = this,
				mask = this.$('.ueditor_thumb'),
				maskHeight = Upfront.data && Upfront.data.uposts && Upfront.data.uposts.featured_image_height ? Upfront.data.uposts.featured_image_height : 300,
				editorOptions = _.extend({}, imageInfo, {
					maskOffset: mask.offset(),
					maskSize: {width: mask.width(), height: maskHeight},
					setImageSize: newImage,
					extraButtons: [
						{
							id: 'image-edit-button-swap',
							text: 'Swap Image',
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

				me.changed.thumb = true;
			});
		},

		editContent: function(e){
			e.preventDefault();
			e.stopPropagation();
			this.editPost('.ueditor_content', this.mode, true);
		},
		editExcerpt: function(e){
			e.preventDefault();
			e.stopPropagation();
			this.editPost('.ueditor_excerpt', 'post_excerpt', true);
		},
		editPost: function(selector, mode, focus){
			var me = this,
				$body = this.$(selector)
			;

			if(!$body.length || $body.data('ueditor')){
				me.prepareBar();
				return;
			}

			//Where did the user click?
			var selection = window.getSelection ? _.clone(window.getSelection()) : false;


			$body.css('opacity', '.6');

			this.getPost().done(function(post){

				//We will need the edition bar
				me.prepareBar();


				var content = post.get(mode);

				if(!content && mode == 'post_excerpt'){
					if(confirm('This post has no excerpt, and what you could see before editing was the first words of the post content. Do you want to convert that words in the excerpt and edit the excerpt? Otherwise you will edit the post contents.')){
						post.set('post_excerpt', $body.html());
					}
					else {
						mode = 'post_content';
					}
				}

				//Init editor
				$body.html(post.get(mode))
					.on('start', function(){
						console.log(selection);
						$body.css('opacity', '1');
						$body.mode = mode;
						me.changed.content = $body;
						//Recalculate limits of the sidebar
						me.prepareBar();
					})
					.ueditor({
						linebreaks: false,
						placeholder: 'Your content goes here ;)',
						autostart: true,
						focus: focus,
						upfrontMedia: mode == 'post_content',
						upfrontImages: mode == 'post_content'
					})
				;
				me.contentEditor = $body.data('ueditor');
				if(focus)
					me.contentEditor.start();
			});
		},
		positionEditor: function(selection){
			var range = this.cke.createRange(),
				domEndNode = selection.focusNode,
				domEndLabel = domEndNode.nodeName,
				editorElement = $(this.cke.element.$)
			;

			while(domEndLabel == '#text'){
				domEndNode = domEndNode.parentNode;
				domEndLabel = domEndNode.nodeName;
			}

			var $node = editorElement.find(domEndLabel + ':contains(' + domEndNode.textContent + ')'),
				node = false
			;

			if($node.length)
				node = $node[0];
		},

		activateEditor: function(e){
			e.preventDefault();
		},

		editDate: function(e){
			if(this.$('.upfront-date_picker').is(':visible'))
				return;

			this.$('.upfront-date_picker').hide();

			var me = this,
				picker = me.$('.ueditor_date').find('.upfront-date_picker'),
				loading = new Upfront.Views.Editor.Loading({
					loading: 'Loading...',
					done: "Here we are!",
					fixed: false
				})
			;

			loading.render();

			picker
				.show()
				.append(loading.$el)
			;

			this.getPost().done(function(post){
				var data = post.toJSON().post_date,
					date = data ? data.split(' ')[0] : false
				;
				loading.$el.remove();

				picker.find('.upfront-bar-datepicker').datepicker('setDate', date);

				date = post.get('post_date');

				var hours = date.getHours(),
					minutes = date.getMinutes()
				;

				picker.find('.ueditor-hours-select').val(hours);
				picker.find('.ueditor-minutes-select').val(minutes);
			});
		},

		cancelDatepicker: function(e){
			e.preventDefault();
			e.stopPropagation();
			this.$('.upfront-date_picker').hide();
		},

		changeDate: function(e) {
			e.preventDefault();
			e.stopPropagation();

			var date = this.$('.upfront-bar-datepicker').datepicker('getDate'),
				now = new Date()
			;

			date.setHours(this.$('.ueditor-hours-select').val());
			date.setMinutes(this.$('.ueditor-minutes-select').val());

			this.post.set('post_date', date);

			if(now.getTime() < date.getTime())
				this.post.set('post_status', 'future');
			else
				this.post.set('post_status', 'publish');

			this.$('.upfront-date_picker').hide();

			var formatted = this.formatDate(date, Upfront.data.ueditor.filters.date);

			this.$('.ueditor_date').html(formatted);
			this.prepareDateEditor('.ueditor_date');

			if(this.bar)
				this.bar.render();
			else
				this.prepareBar();
		},

		formatDate: function(date, format) {
			var source = Upfront.data.ueditor,
				year = date.getFullYear(),
				shortmonth = date.getMonth(),
				shortday = date.getDate(),
				shorthours = date.getHours(),
				shortminutes = date.getMinutes(),
				shortseconds = date.getSeconds(),
				shortmili = date.getMilliseconds(),
				tmonth = source.months[shortmonth],
				tday = source.days[date.getDay()],
				shorthours12 = shorthours % 12,
				labels = {
					year: year,
					shortyear: year % 100,
					shortmonth: shortmonth,
					month: shortmonth < 10 ? '0' + shortmonth : shortmonth,
					shortday: shortday,
					day: shortday < 10 ? '0' + shortday : shortday,
					shorthours: shorthours,
					hours: shorthours < 10 ? '0' + shorthours : shorthours,
					shortminutes: shortminutes,
					minutes: shortminutes < 10 ? '0' + shortminutes : shortminutes,
					shortseconds: shortseconds,
					seconds: shortseconds < 10 ? '0' + shortseconds : shortseconds,
					shortmili: shortmili,
					mili: shortmili < 10 ? '00' + shortmili : (shortmili < 100 ? '0' + shortmili : shortmili),
					tmonth: tmonth,
					tshortmonth: tmonth.substring(0,3),
					tday: tday,
					tshortday: tday.substring(0,3),
					shorthours12: shorthours12,
					hours12: shorthours12 < 10 ? '0' + shorthours12 : shorthours12,
					am:shorthours < 12 ? 'am' : 'pm',
					pm:shorthours < 12 ? 'am' : 'pm',
					date: Upfront.Util.format_date(date)
				},
				output = format
			;

			_.each(labels, function(value, key){
				var regex = new RegExp('%' + key + '%', 'g');
				output = output.replace(regex, value);
			});

			return output;
		},
		editAuthor: function(e) {
			e.preventDefault();
			this.getPost();
			this.authorSelect.open();
		},

		formatAuthor: function(author){
			var output = Upfront.data.ueditor.filters.author,
				keys = _.keys(author)
			;

			_.each(keys, function(k){
				var regex = new RegExp('%' + k + '%', 'g');
				output = output.replace(regex, author[k]);
			});

			return output;
		},

		changeAuthor: function(authorId){
			var me = this;
			this.getPost().done(function(post){
				var authorData =  me.getAuthorData(authorId);

				me.post.set('post_author', authorId);

				if(me.bar)
					me.bar.render();
				else
					me.prepareBar();

				me.$('.ueditor_author').html(me.formatAuthor(authorData));
				me.prepareAuthorEditor('.ueditor_author');

				console.log('Author changed to ' + authorId);
			});
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

		cancelChanges: function(){
			this.fetchPost();
			this.$el.html(this.backup);

			this.closeEditor();

			if (this.post && this.post.get) {
				if (this.post.get("post_status") == "auto-draft") window.location.reload();
				else {
					if (Upfront.Settings.Application.MODE.ALLOW.indexOf(Upfront.Settings.Application.MODE.LAYOUT) == -1) {
						if (!confirm("Do you want to re-load in layout mode?") ) window.location = Upfront.Settings.Content.edit.post + this.post.id;
					} else {
						// Revert to old post.... lalala
						Upfront.Application.start(Upfront.Settings.Application.MODE.LAYOUT);
					}
				}
			}
			this.trigger('editor:cancel', this);
		},

		save: function(status, loadingMsg, successMsg){
			var me = this,
				changed = this.changed,
				updateMeta = changed.thumb,
				metaUpdated = !updateMeta,
				loading = new Upfront.Views.Editor.Loading({
					loading: loadingMsg,
					done: "Here we are!",
					fixed: false
				}),
				postUpdated = false
			;

			loading.render();
			this.$el.append(loading.$el);

			if(changed.title){
				this.post.set('post_title', $.trim(changed.title.text()));
			}
			if(changed.content){
				this.post.set(changed.content.mode, changed.content.html());
			}

			this.post.set('post_status', status);
			this.post.save().done(function(){
				if(metaUpdated){
					loading.$el.remove();
					Upfront.Views.Editor.notify(successMsg);
					if(me.options.onUpdated)
						me.options.onUpdated(me.post.toJSON());
				}
				postUpdated = true;
			});

			if(updateMeta){
				me.post.meta.save().done(function(){
					if(postUpdated){
						loading.done();
						Upfront.Views.Editor.notify(successMsg);
						if(me.options.onUpdated)
							me.options.onUpdated(me.post.toJSON());
					}
					metaUpdated = true;
				});
			}

			this.closeEditor();
		},

		publish: function(){
			this.save('publish', 'Publishing ' + this.post.get('post_type') + ' ...', this.capitalize(this.post.get('post_type')) + ' published');
		},
		saveDraft:function(){
			this.save('draft', 'Saving ' + this.post.get('post_type') + ' ...', this.capitalize(this.post.get('post_type')) + ' saved as a draft');
		},
		capitalize: function(str){
			return str.charAt(0).toUpperCase() + str.slice(1);
		},

		trash: function(){
			var me = this,
				postType = this.post.get('post_type'),
				loading = new Upfront.Views.Editor.Loading({
					loading: 'Deleting ' + postType + ' ...',
					done: "Here we are!",
					fixed: false
				})
			;
			loading.render();
			this.$el.append(loading.$el);
			this.post.set('post_status', 'trash').save().done(function(){
				loading.$el.remove();
				Upfront.Views.Editor.notify('The ' + postType + ' has been deleted.');
				if(me.options.onUpdated)
					me.options.onUpdated(me.post.toJSON());
			});
		},
		closeEditor: function(){
			if(this.bar){
				this.bar.remove();
				this.bar = false;
			}
			if(this.titleEditor){
				this.titleEditor.stop();
				this.titleEditor = false;
			}
			if(this.contentEditor){
				this.contentEditor.stop();
				this.contentEditor = false;
			}
		},
		restore: function(){
			var me = this;
			if(confirm('Are you sure to restore this ' + this.post.get('post_type') + '?'))
				this.post.set('post_status', 'draft').save().done(function(){
					if(me.options.onUpdated)
						me.options.onUpdated(me.post.toJSON());
				});
		}
	});

	var EditionBar = Backbone.View.extend({
		className: 'ueditor-bar-wrapper upfront-ui',
		post: false,

		offset: {min:0, max:0},
		position: {min:0, max:0},

		onScrollFunction: false,

		statusOptions: {
			future: {value:'future', name:'Scheduled'},
			publish: {value: 'publish', name: 'Published'},
			pending: {value: 'pending', name: 'Pending Review'},
			draft: {value: 'draft', name: 'Draft'},
			'private': {value: 'private', name: 'Privately Published'},
			'auto-draft': {value: 'auto-draft', name:'New'},
			'trash': {value: 'trash', name: 'Deleted'}
		},

		visibilityOptions: {
			'public': {value: 'public', name:'Public'},
			'sticky': {value: 'sticky', name:'Sticky'},
			'password': {value: 'password', name: 'Protected'},
			'private': {value: 'private', name: 'Private'}
		},

		statusSelect: false,
		visibilitySelect: false,

		initialStatus: false,

		events: {
			'click .ueditor-action-cancel': 'cancel',
			'click .ueditor-action-publish': 'publish',
			'click .ueditor-action-draft': 'saveDraft',
			'click .ueditor-action-trash': 'trash',
			'click .ueditor-action-url': 'editUrl',
			'click .ueditor-action-tags': 'editTaxonomies',
			'click .ueditor-select-value': 'editSelect',
			'click .ueditor-pass-ok': 'changePass',
			'click .ueditor-action-schedule': 'openDatepicker',
			'click .ueditor-bar-show_advanced': 'toggleAdvanced'
		},

		initialize: function(options){
			var me = this;
			this.post = options.post;
			this.initialStatus = this.post.get('post_status');
			this.initialDate = this.post.get('post_date');
			if(this.initialDate)
				this.initialDate = this.initialDate.getTime();
			this.tpl = _.template(Upfront.data.uposts.barTemplate);
			this.datepickerTpl = _.template($(Upfront.data.tpls.popup).find('#datepicker-tpl').html());
			Upfront.Events.trigger('upfront:element:edit:start', 'write', this.post);
		},

		render: function(){
			this.destroy();
			var me = this,
				postData = this.post.toJSON(),
				date = this.post.get('post_date'),
				datepickerData = {}
			;

			postData.status = this.getBarStatus();
			postData.visibility = this.visibilityOptions[this.post.getVisibility()];

			postData.schedule = this.getSchedule();

			postData.buttonText = this.getButtonText();
			postData.draftButton = ['publish', 'future'].indexOf(this.initialStatus) == -1;
			postData.cancelButton = !(this.post.is_new);

			postData.cid = this.cid;

			datepickerData.minutes = _.range(0,60);
			datepickerData.hours = _.range(0,24);

			datepickerData.currentHour = date.getHours();
			datepickerData.currentMinute = date.getHours();

			postData.datepicker = this.datepickerTpl(datepickerData);

			this.$el.html(this.tpl(postData));

			this.$('.upfront-bar-datepicker').datepicker({
				changeMonth: true,
				changeYear: true,
				dateFormat: 'yy-mm-dd',
				onChangeMonthYear: function(month, year){
					var picker = me.$('.upfront-bar-datepicker'),
						day = picker.datepicker('getDate').getDate()
					;
					day = day < 10 ? '0' + day : day;
					month = month < 10 ? '0' + month : month;

					me.$('.upfront-bar-datepicker').datepicker('setDate', year + '-' + month + '-' + day);
				}
			});

			this.prepareSelectBoxes();

			$("#ui-datepicker-div").addClass('upfront-date_picker upfront-ui');

			if($('#' + this.cid).length)
				this.stick();
		},

		prepareSelectBoxes: function(){
			var me = this;
			this.statusSelect = new MicroSelect({options: this.getStatusOptions()});
			this.visibilitySelect = new MicroSelect({options: this.getVisibilityOptions()});

			this.statusSelect.on('select', function(status){
				me.post.set('post_status', status);
				me.render();
			});

			this.visibilitySelect.on('select', function(visibility){
				if(visibility == 'password')
					me.showPassEditor(me.$('.ueditor-select-visibility'));
				else{
					me.post.setVisibility(visibility);
					me.render();
				}
			});

			this.$('.ueditor-select-visibility').append(this.visibilitySelect.$el);
			this.$('.ueditor-select-status').append(this.statusSelect.$el);
		},

		getBarStatus: function(){
			var current = this.post.get('post_status');
			if(['auto-draft', 'draft', 'pending'].indexOf(current) != -1)
				return this.statusOptions[current];
			return this.statusOptions[this.initialStatus];
		},

		getSchedule: function(){
			var now = new Date(),
				date =  this.post.get('post_date'),
				formatDate = Upfront.Util.format_date
			;
			if(!date && !this.initialDate)
				return {
					key: 'Publish',
					text: 'Inmediately'
				};

			if(date.getTime() == this.initialDate){
				if(date.getTime() < now.getTime())
					return {
						key: 'Published',
						text: formatDate(date, true)
					};
				else
					return {
						key: 'Scheduled',
						text: formatDate(date, true)
					};

			}
			if(date.getTime() < now.getTime())
				return {
					key: 'Publish on',
					text: formatDate(date, true)
				};
			else
				return {
					key: 'Schedule',
					text: formatDate(date, true)
				};
		},
		openDatepicker: function(e){
			var data = this.post.toJSON().post_date,
				date = data ? data.split(' ')[0] : false
			;
			this.$('.upfront-date_picker').toggle();

			if(date){
				this.$('.upfront-bar-datepicker').datepicker('setDate', date);

				date = this.post.get('post_date');

				var hours = date.getHours(),
					minutes = date.getMinutes()
				;

				this.$('.ueditor-hours-select').val(hours);
				this.$('.ueditor-minutes-select').val(minutes);
			}
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

		getVisibilityOptions: function(){
			var now = this.post.getVisibility(),
				ops = this.visibilityOptions
			;
			if(now == 'password')
				return [
					{value: 'password', name: 'Edit password...'},
					ops.public,
					ops.sticky,
					ops.private
				]
			;
			return _.values(ops);
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
					return 'Update';
				return 'Schedule';
			}
			else {
				if(initial == 'publish')
					return 'Update';
				return 'Publish';
			}
		},

		calculateLimits: function(){
			var ph = this.$('.ueditor-bar-ph'),
				container = this.$el.parent()
			;
			if (!container.length) return false;

			//We make sure that we are positing the bar again:
			ph.css('position', 'static');

			this.offset = {
				min: container.offset().top + 100,
				max: ph.offset().top + ph.height()
			};

			this.position = {
				min: this.offset.min - container.offset().top,
				max: ph.position().top
			};
		},

		onScroll: function(e, bar){
			var me = this,
				now = $(window).scrollTop() + $(window).height(),
				position = bar.css('position')
			;
			if(position == 'fixed'){
				if (now <= me.offset.min){
					bar.css({
							position: 'absolute',
							bottom: 'auto',
							top: me.position.min + 'px',
							left:0,
							width: '100%',
							opacity: 1
						})
						.removeClass('floating')
					;
					me.calculateLimits();
				}
				else if( now >= me.offset.max){
					bar.css({
							position: 'absolute',
							bottom: 'auto',
							top: me.position.max + 'px',
							left:0,
							width: '100%',
							opacity: 1
						})
						.removeClass('floating')
					;
					me.calculateLimits();
				}
			}
			else if(position == 'absolute'){
				if(now < me.offset.max && now > me.offset.min){
					bar.css({
							position: 'fixed',
							bottom: '0px',
							left: bar.offset().left + 'px',
							top: 'auto',
							width: bar.outerWidth() + 'px',
							opacity: 0.4
						})
						.addClass('floating')
						.removeClass('show-advanced')
					;
					me.calculateLimits();
				}
			}

		},

		stick: function(){
			var ph = this.$('.ueditor-bar-ph'),
				bar = this.$('.ueditor-bar'),
				container = this.$el.parent(),
				me = this
			;

			ph.height(bar.height());

			container.css('position', 'relative');

			bar.css({
				position: 'absolute',
				bottom: '0',
				left: '0',
				width: '100%'
			});

			this.calculateLimits();

			this.onScrollFunction = function(e){
				me.onScroll(e, bar);
			};

			$(window).on('scroll', this.onScrollFunction);
			this.onScroll(null, bar);
		},

		destroy: function(){
			$(window).off('scroll', this.onScrollFunction);
			this.onScrollFunction = false;
		},

		cancel: function(e){
			e.preventDefault();
			if(confirm('Are you sure to discard the changes made to ' + this.post.get('post_title') + '?')){
				this.destroy();
				this.post.trigger('editor:cancel');
				this.trigger('editor:cancel');
				Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
			}
		},

		publish: function(e){
			e.preventDefault();

			this.destroy();

			this.initialStatus = this.post.get('post_status');
			this.initialDate = this.post.get('post_date').getTime();

			this.post.trigger('editor:publish');
			this.trigger('editor:publish');
			Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
		},

		saveDraft: function(e){
			e.preventDefault();

			this.destroy();

			this.initialStatus = this.post.get('post_status');
			this.initialDate = this.post.get('post_date').getTime();

			this.post.trigger('editor:draft');
			this.trigger('editor:draft');
			Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
		},

		trash: function(e){
			e.preventDefault();
			if(confirm('Are you sure you want to delete this ' + this.post.get('post_type') + '?')){
				this.destroy();
				this.post.trigger('editor:trash');
				Upfront.Events.trigger('upfront:element:edit:stop', 'write', this.post);
			}
		},

		editUrl: function(e){
			e.preventDefault();
			var me = this,
				$popup = {},
				popup = Upfront.Popup.open(function (data, $top, $bottom) {
					var $me = $(this);
					$me.empty()
						.append('<p class="upfront-popup-placeholder">No such thing as <q>too many drinks</q>.</p>')
					;
					$popup = {
						"top": $top,
						"content": $me,
						"bottom": $bottom
					};
				}),
				update = function(slug){
					me.post.set('post_name', slug);
					Upfront.Popup.close();
				},
				tpl = _.template($(Upfront.data.tpls.popup).find('#upfront-slug-tpl').html())
			;

			$popup.content.html(tpl({
				rootURL: window.location.origin + '/',
				slug: me.post.get('post_name')
			}));

			$popup.content.off('click', '#upfront-post_slug-send')
				.on('click', '#upfront-post_slug-send', function(){
					update($('#upfront-post_slug').val());
				})
				.off('keydown', '#upfront-post_slug')
				.on('keydown', '#upfront-post_slug', function(e){
					if(e.which == 13){
						e.preventDefault();
						update($('#upfront-post_slug').attr('disabled', true).val());
					}
				})
			;
		},
		editTaxonomies: function(e){
			if(e)
				e.preventDefault();

			var me = this,
				tmp = $('body').append('<div id="upfront-post_taxonomies" style="display:none" />'),
				$tax = $("#upfront-post_taxonomies"),
				$popup = {},
				views = {category: false, post_tag: false},
				currentView = 'category',
				terms = {},
				popup = Upfront.Popup.open(function (data, $top, $bottom) {
					var $me = $(this);
					$me.empty()
						.append('<p class="upfront-popup-placeholder"><q>I enjoy eating cheese.</q></p>')
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

					$popup.content.html('<p class="upfront-popup-placeholder"><q>Them frogs chirp really loud today.</q></p>');

					termsList.fetch({allTerms: true}).done(function(response){
						var tax_view_constructor = response.data.taxonomy.hierarchical ? ContentEditorTaxonomy_Hierarchical : ContentEditorTaxonomy_Flat,
							tax_view = new tax_view_constructor({collection: termsList})
						;

						tax_view.allTerms = new Upfront.Collections.TermList(response.data.allTerms);

						views[tax] = tax_view;
						render_panel();

					});

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
					'<li data-type="category">Categories</li>' +
					'<li data-type="post_tag">Tags</li>' +
				'</ul>' +
				$popup.top.html()
			);

			$popup.top.find('.upfront-tabs li').on("click", function () {
				dispatch_taxonomy_call(this);
			});

			$tax.show();

			dispatch_taxonomy_call($popup.top.find('.upfront-tabs li:first'));

			Upfront.Events.on("upfront:post:taxonomy_changed", function () {
				dispatch_taxonomy_call($popup.top.find('.upfront-tabs li.active'));
			});
		},

		editSelect: function(e){
			e.preventDefault();
			var type = $(e.target).data('id');
			this[type + 'Select'].open();
		},

		showPassEditor: function(parent){
			var op = this.visibilityOptions.password,
				me = this
			;

			parent.find('.ueditor-select-value')
				.data('id', op.value)
				.text(op.name)
			;

			parent.find('.ueditor-select-options').hide();

			parent.find('.ueditor-pass-editor').show()
				.find('input')
					.one('blur', function(e){
						setTimeout(function(){
							me.render();
						}, 300);
					})
					.off('keydown')
					.on('keydown', function(e){
						if(e.which == 13){
							me.changePass(e);
						}
					})
					.focus()
			;
		},

		changePass: function(e){
			var pass = $(e.target).parent().find('input').val();
			if(pass){
				this.post.setVisibility('password');
				this.post.set('post_password', pass);
				this.render();
			}
		},

		toggleAdvanced: function(e){
			e.preventDefault();
			$(e.target).closest('.ueditor-bar').toggleClass('show-advanced');
		}


	});


	var ContentEditorTaxonomy_Hierarchical = Backbone.View.extend({
		className: "upfront-taxonomy-hierarchical",
		events: {
			"click #upfront-add_term": "handle_new_term",
			"keydown #upfront-add_term": "handle_enter_new_term",
			"change .upfront-taxonomy_item": "handle_terms_update",
			'keydown #upfront-new_term': 'handle_enter_new_term'
		},
		termListTpl: false,
		termSingleTpl: false,
		updateTimer: false,
		allTerms: false,
		initialize: function(options){
			//this.collection.on('add remove', this.render, this);
			this.termListTpl = _.template($(Upfront.data.tpls.popup).find('#upfront-term-list-tpl').html());
			this.termSingleTpl = _.template($(Upfront.data.tpls.popup).find('#upfront-term-single-tpl').html());
		},

		render: function() {
			this.$el.html(
				this.termListTpl({
					allTerms: this.allTerms,
					postTerms: this.collection,
					termTemplate: this.termSingleTpl,
					labels: this.collection.taxonomyObject.labels,
				})
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
		}
	});

	var ContentEditorTaxonomy_Flat = Backbone.View.extend({
		"className": "upfront-taxonomy-flat",
		termListTpl: false,
		termSingleTpl: false,
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
			this.termListTpl = _.template($(Upfront.data.tpls.popup).find('#upfront-flat-term-list-tpl').html());
			this.termSingleTpl = _.template($(Upfront.data.tpls.popup).find('#upfront-term-flat-single-tpl').html());
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

	var ContentEditors = function () {
		var _editors = {};

		var add = function (options) {
			console.log('Simple editor deprecated. Use the new Ueditor');
			return {on: function(){}}
		};

		return {
			add: add
		};
	};

	var Link_CkeDialog = Backbone.View.extend({
		TYPES: {
			external: "external",
			internal: "internal",
			anchor: "anchor"
		},
		events: {
			"change .upfront-field-wrap-radios :radio": "swap_selection",
			"click .upfront-save_settings": "apply_linkage"
		},
		initialize: function () {
			if (this.options.href) {
				var type = this.options.href.match(/^#/) ? this.TYPES.anchor : this.TYPES.external,
					href = this.options.href.match(/^#/) ? this.options.href.replace(/#/, '') : this.options.href
				;
				this.model.set_property("type", type);
				this.model.set_property("url", href);
			}
			this.model.init_property("type", this.TYPES.anchor);
			this.settings = new Upfront.Views.Editor.Field.Radios({
				model: this.model,
				property: "type",
				layout: 'horizontal-inline',
				values: [
					{label: "External URL", value: this.TYPES.external},
					{label: "Post/Page", value: this.TYPES.internal},
					{label: "Anchor", value: this.TYPES.anchor}
				]
			});
			this.url_field = false;
		},
		render: function () {
			this.$el.empty().append('<div class="wrap" />');
			var $el = this.$el.find(".wrap");
			$el.empty();
			this.settings.render();
			$el.append(this.settings.$el);
			$el.append("<div id='upfront-cke-link_editor-link_type' />");
			this.$el.append("<button type='button' class='upfront-save_settings'>Ok</button>");

			this.$el.offset(this.options.offset);

			this.swap_selection();
		},
		swap_selection: function (e) {
			var $type = this.$el.find("#upfront-cke-link_editor-link_type"),
				current = this.settings.get_value(),
				url = this.model.get_property_value_by_name("url")
			;
			$type.empty();
			if (!current) return false;

			if (this.TYPES.external === current) {
				this.url_field = new Upfront.Views.Editor.Field.Text({
					model: this.model,
					property: "url",
					default_value: url,
				});
				this.url_field.render();
				$type.append(this.url_field.$el);
			} else if (this.TYPES.internal === current) {
				var me = this;
				Upfront.Views.Editor.PostSelector.open({
					// Additional options here yay
				}).done(function(post){
					if (!post || !post.get) {
						return false;
					}
					me.trigger("link:set", post.get("permalink"), me.TYPES.internal);
				});
			} else if (this.TYPES.anchor === current) {
				var $field = this.$el.find(".upfront-field-multiple.upfront-field-multiple-horizontal-inline.upfront-field-multiple-selected"),
					$select = $field.find(".upfront-field-wrap.upfront-field-wrap-select")
				;
				if ($select.length) $select.remove();
				this.url_field = new Upfront.Views.Editor.Field.Anchor({
					model: this.model,
					property: "url",
					default_value: url,
				});
				this.url_field.render();
				$field.append(this.url_field.$el);
				$field
					.find(".upfront-field-wrap.upfront-field-wrap-select").on("change", function (e) {
						e.stopPropagation();
					}).end()
					.find("label").css({
						"float": "left",
						"padding-top": "1.4em"
					}).end()
					.find(".upfront-field-wrap.upfront-field-wrap-select").css({
						"float": "right",
						"margin-left": 10
					})
				;
			}
			return false;
		},
		apply_linkage: function () {
			var url = this.url_field.get_value() || this.model.get_property_value_by_name("url"),
				type = this.settings.get_value()
			;
			this.trigger("link:set", url, type);
		}
	});

	var Link_DispatchManager = new (Backbone.View.extend({

		initialize: function () {
			Upfront.Events.on("upfront:editor:init", this.rebind_ckeditor_link, this);
		},

		rebind_ckeditor_link: function () {
			var me = this;
			_(CKEDITOR.instances).each(function (editor) {
				var link = editor.getCommand('link');
				if (link && link.on) link.on("exec", me.ck_open, me);

				editor.on('doubleclick', function (evt) {
					if (evt.data && evt.data.dialog && ('link' === evt.data.dialog || 'anchor' === evt.data.dialog)) evt.data.dialog = false;
					var element = CKEDITOR.plugins.link.getSelectedLink(editor) || evt.data.element;

					if (!element.isReadOnly() && element.is('a')) {
						editor.getSelection().selectElement(element);
						me.ck_open({
							href: element.getAttribute('href')
						});
					}
				});
			});
		},

		ck_open: function (data) {
			var me = this,
				editor = CKEDITOR.currentInstance,
				selection = editor.getSelection(),
				bookmarks = selection.createBookmarks(),
				$el = $(bookmarks[0].startNode.$).parent(),
				offset = false,
				_check = function () {
					if (selection.getRanges()[0].endOffset === editor.getSelection().getRanges()[0].endOffset) return false;
					$("#upfront-cke-link_editor").remove();
				}
			;
			if ($el.is("span")) {
				$el = $el.find('[data-cke-bookmark]').first();
				var tmp = $el.show().offset();
				offset = {
					top: tmp.top ? tmp.top + $el.height() : tmp.top,
					left: tmp.left
				}
				$el.hide();
			}
			selection.selectBookmarks(bookmarks);
			this.open(_.extend(data, {
				el: $el,
				offset: offset
			}));
			editor.editable().on("click", _check);
			editor.on("destroy", function () {
				$("#upfront-cke-link_editor").remove();
			});
			Link_DispatchManager.instance = CKEDITOR.currentInstance.name;
			return false;
		},

		on_close: function (href, type) {
			var editor = CKEDITOR.instances[Link_DispatchManager.instance],
				text = false,
				link = new CKEDITOR.dom.element('a'),
				link_href = Link_CkeDialog.prototype.TYPES.anchor === type
					? '#' + href.replace(/#/, '')
					: href.match(/^https?\:\/\//) ? href : window.location.protocol + '//' + href
			;
			editor.focus();
			text = editor.getSelection().getSelectedText();
			link.setAttributes({href: link_href});
			link.setText(text);
			editor.insertElement(link);
		},

		open: function (options) {
			options = options || {};
			var $root = false,
				offset = {
					top: 0,
					left: 0
				}
			;
			if ($("#upfront-cke-link_editor").length) $("#upfront-cke-link_editor").remove();
			$("body").append("<div id='upfront-cke-link_editor' />");
			$root = $("#upfront-cke-link_editor");
			if (options.el && options.el.length && !options.offset) {
				var tmp = options.el.offset();
				offset = {
					top: (tmp.top ? tmp.top + options.el.height() : tmp.top),
					left: tmp.left
				};
			} else if (options.offset) {
				offset = options.offset;
			}
			var me = this,
				dialog = new Link_CkeDialog(_.extend({}, options, {
					model: new Upfront.Models.ObjectModel(),
					el: $root,
					offset: offset
				}))
			;
			dialog.render();
			dialog.on("link:set", function (link, type) {
				dialog.remove();
				me.on_close(link, type);
			});
		}

	}))();

	Upfront.Content = {
		TYPES: {'SIMPLE': 'simple'},
		editor: Editor_Meta,
		editors: new ContentEditors(),
		microselect: MicroSelect,
		Link_CkeDialog: Link_CkeDialog
	};

});
})(jQuery);
