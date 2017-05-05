(function ($) {
define([
	'text!elements/upfront-image/tpl/video_editor.html'
], function(editorTpl) {
	var l10n = Upfront.Settings.l10n.image_element;
	var l10nG = Upfront.Settings && Upfront.Settings.l10n
		? Upfront.Settings.l10n.global.views
		: Upfront.mainData.l10n.global.views;

	// Had some mysterious issue with deferred not being the one we need,
	// this resolves it.
	var theOneDeferred;

	var VideoSelector = Backbone.View.extend({
		selectorTpl: _.template($(editorTpl).find('#selector-tpl').html()),
		progressTpl: _.template($(editorTpl).find('#progress-tpl').html()),
		formTpl: _.template($(editorTpl).find('#upload-form-tpl').html()),
		defaultOptions: {multiple: false, multiple_sizes: true, preparingText: l10nG.preparing_video_upload},
		options: {},


		initialize: function(){
			// Set the form up
			this.setup_upload_form();
		},
		setup_upload_form : function(){
			var me = this;
			if ($('#upfront-upload-video').length === 0) {
				$('body').append(me.formTpl({url: Upfront.Settings.ajax_url, l10n: l10n.template}));

				$('body').bind( 'keyup', function( event ) {
					if ( event.keyCode === 27 )
						me.closeOverlay();
				});

				var progress = $('#upfront-progress'),
					fileInput = $('#upfront-video-file-input'),
					form = $('#upfront-upload-video')
				;

				if (!!form.fileupload) {
					form.fileupload({
							sequentialUploads: true,
							formData: _.extend({action: 'upfront-media-upload'}, Upfront.Media.Ref),
							fileInput: null, // disable change listener, we handle it below
							paramName: 'media[]' // due to previous options we have to set this manually
						})
						.bind('fileuploadstart', function () {
							progress.css('width', '0');
						})
						.bind('fileuploadprogressall', function (e, data) {
							var percent = parseInt(data.loaded / data.total * 100, 10);
							progress.css('width', percent + '%');
						})
						.bind('fileuploaddone', function (e, data) {
							var response = data.result;
							progress.css('width', '100%');
							$('#upfront-image-uploading h2').html(l10nG.preparing_video_upload);
							me.onFileUploadDone(response);
							form[0].reset();
						})
						.bind('fileuploadfail', function (e, response) {
							var error;

							// Check if responseJSON exist to prevent JS errors
							if(response.jqXHR.responseJSON !== "undefined" && response.jqXHR.responseJSON) {
								error = response.jqXHR.responseJSON.error;
							} else {
								error = response.jqXHR.statusText;
							}

							Upfront.Views.Editor.notify(error, 'error');
							me.openSelector();
							form[0].reset();
						});
				}

				fileInput.on('change', function(){
					if (this.files.length) {
						if (this.files[0].name.match(/\.(mp4|webm)$/) === null) {
							Upfront.Views.Editor.notify(l10nG.allowed_video_type_error, 'error');
							return;
						}
						if(XMLHttpRequest && (new XMLHttpRequest()).upload) { //XHR uploads!
							me.uploadVideo(this.files);
						} else {
							me.openProgress(function() {
								form.fileupload('add', {
									fileInput: fileInput
								});
							});
						}
					}
				});
			}
			// Form never needs to be seen
			$('#upfront-upload-video').hide();
		},

		onFileUploadDone: function(response) {
			var me = this;
			Upfront.Util.post({
				action: 'upfront-media-video_info',
				video_id: response.data[0]
			})
				.done(function(response2){
					var filename = $('source', response2.data.url).attr('src').split('?')[0];
					$('body').append('<video id="tempVideoForThumb" controls="controls" preload="none"></video>');

					var $tempVideo = $('#tempVideoForThumb');
					var tempVideo = $tempVideo[0];
					var donethedead = false;

					var getThumb = function() {
						var thumbName = filename.split('/');
						thumbName = thumbName[thumbName.length - 1];
						thumbName = thumbName.split('.');
						thumbName = thumbName[0] + '-video-thumbnail.png';

						donethedead = true;

						var width = $tempVideo.width();
						var height = $tempVideo.height();
						var canvas = document.createElement('canvas');
						var aspect = Math.round(width/height*100)/100;
						canvas.width = width;
						canvas.height = height;

						var ctx = canvas.getContext('2d');
						ctx.drawImage(tempVideo, 0, 0, width, height);
						var base64image = canvas.toDataURL();

						// Let's generate thumbnail and save all info so we can pop it
						// up when video is just chosen from media library
						var data = {
							videoId: response.data[0],
							embed: response2.data.url,
							width: width,
							height: height,
							aspect: aspect,
							base64image: base64image,
							thumbname: thumbName,
							action: 'upfront-save-video-info'
						};

						Upfront.Util.post(data).done( function(response3) {
							var videoData = {
								id: response.data[0],
								embed: response2.data.url,
								cover: response3.data.thumburl,
								width: width,
								height: height,
								aspect: aspect
							};
							theOneDeferred.resolve(videoData);
							$tempVideo.remove();
						});
					};

					tempVideo.addEventListener('canplay', function() {
							this.currentTime = 0;
					}, false);
					tempVideo.addEventListener('seeked', function() {
						if (donethedead) return;
						    getThumb();
					}, false);

					tempVideo.src = filename;
					tempVideo.load();
				})
			.error(function(){
				Upfront.Views.Editor.notify(l10n.sel.upload_error, 'error');
				me.openSelector();
			});
		},

		open: function(options) {
			theOneDeferred = $.Deferred();

			if(! _.isObject(options)) {
				options = {};
			}

			this.options = _.extend({}, this.defaultOptions, options);

			this.openSelector();

			Upfront.Events.trigger('upfront:element:edit:start', 'media-upload');

			return theOneDeferred.promise();
		},

		openSelector: function() {
			var me = this;
			this.openOverlaySection(this.selectorTpl, {}, function() {
				var input = $('#upfront-video-file-input');
				if (me.options.multiple === true) {
					input.attr('multiple','multiple');
					input.attr('name', 'media[]');
				} else {
					input.attr('multiple', false);
					input.removeAttr('multiple');
					input.attr('name', 'media');
				}

				$('#upront-image-placeholder')
					.on('dragenter', function(e){
						e.preventDefault();
						e.stopPropagation();
					})
					.on('dragleave', function(e){
						e.preventDefault();
						e.stopPropagation();
						$(this).css('border-color', '#C3DCF1');
						$(this).css('background', 'none');
					})
					.on('dragover', function(e){
						e.preventDefault();
						e.stopPropagation();
						$(this).css('border-color', '#1fcd8f');
						$(this).css('background', 'rgba(255,255,255,.1)');
						$(this).find();
					})
					.on('drop', function(e){
						var files;
						e.preventDefault();
						e.stopPropagation();
						if (e.originalEvent.dataTransfer) {
							files = e.originalEvent.dataTransfer.files;

							// Only call the handler if 1 or more files was dropped.
							if (files.length) {
									//input[0].files = files;
									me.uploadVideo(files);
							}
						}
					});

				me.resizeOverlay();
			});
		},

		openProgress: function(callback){
			var me = this;
			this.openOverlaySection(this.progressTpl, {}, function() {
				me.resizeOverlay();
				callback();
			});
		},

		resizeOverlay: function(){
			var overlay = $('#upfront-image-overlay');
			if(!overlay.length) {
				return;
			}

			var placeholder = $('#upront-image-placeholder'),
				uploading = $('#upfront-image-uploading'),
				phcss = {},
				// Compensate positioning for sidebar.
				left = parseInt($('#page').css('marginLeft'), 10),
				style = {
					left: left,
					width: $(window).width() - left,
					height: $(window).height()
				},
				ptop = (style.height / 2 - 220)
			;

			if(ptop > 0){
				overlay.removeClass('small_placeholder');
				ptop += 'px';
			}
			else {
				overlay.addClass('small_placeholder');
				ptop = (style.height / 2 - 140) + 'px';
			}

			overlay.css(style);
			phcss = {
				height: style.height - 100,
				'padding-top':  ptop
			};

			placeholder.css(phcss);
			uploading.css(phcss);
		},

		close: function() {
			this.closeOverlay();
		},

		cancelOverlay: function(e) {
			if(e.target === e.currentTarget) {
				this.closeOverlay(e);
			}
		},
		closeOverlay: function(){
			$('#upfront-image-overlay')
				.off('click')
				.fadeOut('fast', function(){
					$(this).remove();
					$('#upfront-image-overlay').remove();
				})
			;

			$('html').css({
				overflow: this.bodyOverflow ? this.bodyOverflow : 'auto',
				height: 'auto',
				width: 'auto'
			});

			$('body').removeClass('upfront-image-upload-open');

			if(this.reopenSettings){
				$('#settings').fadeIn();
				this.reopenSettings = false;
			}

			//Restart draggable
			//this.parent_module_view.$('.upfront-editable_entity:first').draggable('enable');

			$(window).off('resize', this.resizeOverlay);
			Upfront.Events.trigger('upfront:element:edit:stop');
		},

		openOverlaySection: function(tpl, tplOptions, callback){
			var me = this,
				settings = $('#settings'),
				overlay = $('#upfront-image-overlay')
				//,parent = this.parent_module_view.$('.upfront-editable_entity:first')
			;

			tplOptions.l10n = l10n.template;

			/*
			if(!this.elementSize.width)
				this.setElementSize();
			*/
			if(overlay.length){
				$('.upfront-image-section').fadeOut('fast', function(){
					var content = $(tpl(tplOptions)).hide();
					overlay.append(content);
					content.fadeIn('fast');
					$(this).remove();
					if(callback){
						callback(overlay);
					}
				});
				return;
			}

			this.bodyOverflow = $('html').css('overflow');
			$('html')
				.css({
					overflow: 'hidden',
					width: $(window).width() + 'px',
					height: $(window).height() + 'px'
				})
			;

			//Stop draggable
			/*
			if (parent.is(".ui-draggable"))
				parent.draggable('disable');
			*/

			overlay = $('<div id="upfront-image-overlay" class="upfront-ui"></div>').append(tpl(tplOptions)).hide();

			$('body')
				.append(overlay)
				.addClass('upfront-image-upload-open')
			;


			this.setOverlayEvents();

			overlay.fadeIn('fast');
			this.resizeOverlay();

			$(window)
				.on('resize', function(e){
					if(e.target === window){
						me.resizeOverlay();
					}
				})
			;

			if(settings.is(':visible')){
				settings.fadeOut();
				this.reopenSettings = true;
			}

			if(callback) {
				callback(overlay);
			}
		},
		setOverlayEvents: function() {
			var me = this;
			$('#upfront-image-overlay')
				.on('click', function(e){
					me.cancelOverlay(e);
				})
				.on('click', 'a.select-files', function(e){
					me.openFileBrowser(e);
				})
				.on('click', 'a.open-media-gallery', function(e){
					me.openMediaGallery(e);
				})
			;
		},
		openMediaGallery: function(e) {
			var me = this,
				opts = {
					multiple_selection: this.options.multiple,
					multiple_sizes: this.options.multiple_sizes,
					media_type:['videos']
				}
			;
			e.preventDefault();

			Upfront.Media.Manager.open(opts)
				.done(function(popup, result){
					if(result && result.length > 0){
						var video_id = result.at(0).get('ID');
						Upfront.Util.post({
							action: 'upfront-get-video-info',
							video_id: video_id
						})
							.done(function(response2){
								theOneDeferred.resolve(response2.data.videoinfo);
							})
						.error(function(){
							Upfront.Views.Editor.notify(l10n.sel.upload_error, 'error');
							me.openSelector();
						});

						me.openProgress(function(){
							$('#upfront-image-uploading h2').html(me.options.preparingText);
						});
					}
				})
			;
		},
		openFileBrowser: function(e){
			e.preventDefault();
			$('#upfront-video-file-input').click();
		},
		checkFileUpdate: function(){
			 return true;
		},
		uploadVideo: function(files){
			var me = this;
			me.setup_upload_form();
			this.openProgress(function() {
				$('#upfront-upload-video').fileupload('send', {files: files});
			});
		}
	});

	return VideoSelector;
});
})(jQuery);
