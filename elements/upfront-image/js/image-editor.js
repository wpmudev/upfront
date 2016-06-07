(function ($) {
define([
	'text!elements/upfront-image/tpl/image_editor.html',
	'elements/upfront-image/js/crop-controls',
], function(editorTpl, CropControls) {
	var l10n = Upfront.Settings.l10n.image_element;
	var breakpointColumnPadding = Upfront.Views.breakpoints_storage.get_breakpoints().get_active().get('column_padding');
	breakpointColumnPadding = parseInt(breakpointColumnPadding, 10);
	breakpointColumnPadding = _.isNaN(breakpointColumnPadding) ? 15 : breakpointColumnPadding;

	/**
	 * The image editor needs the image to be uploaded as an attachment to WP in order to work.
	 * The open method must receive the following options in an array:
	 * {
	 * 		id: The image attachment id. It is mandatory for the edition in the server side.
	 * 		maskOffset: and array with the offset of the mask element relative to the top left of the page
	 * 	 	maskSize: an array with the size of the mask
	 * 	 	position: (optional:[{top:0, left:0}]) if the image is cropped is the offset of the crop relative to the original size of the image
	 * 	 	size: the size of the image if it wasn't cropped
	 * 	 	fullSize: the size of the original image
	 * 	 	srcOriginal: the source url of the original image (the best to edit)
	 * 	 	src: the source url of the image in the page
	 * 	 	rotation: (optional:[0]) The angle of rotation of the image on the page relative to the original
	 * 	 	align: (optional:['left']) alignment of the image (used if the image is smaller than the mask)
	 * 	 	setImageSize: (optional:[false]) Boolean to tell the editor to calculates an initial size for the image. Default false.
	 * 	 	buttons: (optional:[[]]) An array with extra buttons for the editor. Every button is an object with
	 * 	 		'id': HTML id for the button
	 * 	 		'text': Tooltip text for the button
	 * 	 		'callback': A function to be called when clicked.
	 * 	 	resizeElement: (ObjectView): An element to resize when the image is smaller than the element or it is expanded to 100%
	 *
	 * }
	 * @return Promise When edition is successful an response object is return as parameter for the promise with the following attributes:
	 * {
	 * 		imageId: The attachment id
	 * 		imageSize: The result image size without cropping
	 * 		imageOffset: The offset of the crop relative to the top-left of the image.
	 * 		maskSize: The size of the mask
	 * 		cropSize: The size of the crop
	 * 		src: The source url of the crop
	 * 		srcFull: The source url of the full version. It may be a rotated version of the original.
	 * 		rotation: Angle of rotation relative to the original image
	 * 		fullSize: the size of the original image
	 * 		align: alignment for the image
	 * 		stretch: Whether the image is wider than the mask. If the image is narrower should be aligned instead of stretched when resizing.
	 * }
	 */
	var ImageEditor = Backbone.View.extend({
		id: 'upfront-image-edit',
		rotation: 0,
		mode: 'big', // big | small | vertical | horizontal
		invert: false,
		tpl: _.template($(editorTpl).find('#editor-tpl').html()),
		src: '#',
		bordersWidth: 0,
		response: false,
		fullSize: {width: 0, height:0},
		buttons: [],
		sizes: false,

		events: {
			'click #image-edit-button-ok': 'imageOk',
			'click .image-align-point': 'pointAlignment',
			'click #image-edit-button-align': 'selectAlign',
			// 'click .image-edit-rotate': 'rotate',
			'click .image-fit-element-button': 'fillImage',
		},

		initialize: function(){
			var me = this;
			this.$el.on('click', function(e){
				if(e.target === e.currentTarget){
					if(me.saveOnClose) {
						me.imageOk();
					} else if(!me.isResizing && !me.isDragged) {
						me.cancel();
					}
				}
				me.isResizing = false;
				me.isDragged = false;
			});

			$('body').bind( 'keyup', function( event ) {
				if ( event.keyCode === 27) {
					if('undefined' !== typeof me.element_id) {
						me.close();
					}
				}
			});
		},

		resetDefaults: function(){
			this.rotation = 0;
			this.mode = 'big';
			this.invert = false;
			this.src = '#';
			//this.response = false;
			this.fullSize = {width: 0, height:0};
			this.setImageInitialSize = false;
			this.buttons = [
				{id: 'image-edit-button-ok', text: l10n.btn.save_label, tooltip: l10n.btn.save_info}
			];
			this.sizes = false;
			//this.promise = false;
			this.align = 'left';
			this.valign = 'top';
			this.isDotAlign = false;
			this.saveOnClose = false;
			this.elementSize = false;
			this.fitImageButton = true;
		},

		centerImageOffset: function(imageSize, maskSize){
			return {
				top: - (imageSize.height - maskSize.height) / 2,
				left: - (imageSize.width - maskSize.width) / 2
			};
		},
		
		createImageControl: function(options) {
			var control = new Upfront.Views.Editor.InlinePanels.ImageControl(),
				me = this,
				cols = options.element_cols;

			var cropControls = new CropControls({
				model: this.model
			});

			this.listenTo(cropControls, 'crop:swap:image', this.changeImage);
			this.listenTo(cropControls, 'crop:reset:image', this.image100);
			this.listenTo(cropControls, 'crop:fit:image', this.fitImage);
			this.listenTo(cropControls, 'crop:fill:image', this.fillImage);	
			
			control.view = cropControls;
			
			control.tooltip = l10n.btn.image_tooltip;

			control.render();
			
			setTimeout(function() {

				if(cols < 5) {
					me.$el.find('.image-edit-button').css({
						width: 50,
					});
					
					me.$el.find('.image-ok-button').css({
						left: options.maskOffset.left + (options.maskSize.width - 50)
					});
				}

				// If element size cols are 3 and 4
				if(cols < 5 && cols > 2) {
					me.$el.find('#image-edit-buttons').css({
						top: options.maskOffset.top,
						left: options.maskOffset.left - 36
					});

					me.$el.find('.image-align-points').css({
						left: options.maskOffset.left
					});
				}

				// If element size cols are less than 3
				if(cols < 3) {
					me.$el.find('#image-edit-buttons').css({
						top: options.maskOffset.top,
						left: options.maskOffset.left - 36
					});

					var dots = me.$el.find('.image-align-points');
					
					dots.css({
						left: (options.maskOffset.left - (dots.width() / 2)) + (options.maskSize.width / 2)
					});

					me.$el.find('.image-ok-button').css({
						top: options.maskOffset.top,
						left: options.maskOffset.left + (options.maskSize.width + 35)
					});
					
					me.$el.find('.image-ok-button').prepend('<div class="image-edit-size-buttons"><span class="image-increase-size">+</span><span class="image-decrease-size">-</span></div>');
				
					var sizeButtons = me.$el.find('.image-edit-size-buttons'),
						size = me.options.size,
						ratio = size.width / size.height;

					if(sizeButtons.length) {
						sizeButtons.find('.image-increase-size').click(function(e) {
							e.preventDefault();
							var step = 1;
							
							if(typeof e.shiftKey !== "undefined" && e.shiftKey === true) {
								step = 5;
							}
							
							me.buttonIncreaseSize(step, ratio);
						});
						
						sizeButtons.find('.image-decrease-size').click(function(e) {
							e.preventDefault();
							var step = 1;
							
							if(typeof e.shiftKey !== "undefined" && e.shiftKey === true) {
								step = 5;
							}
							
							me.buttonDecreaseSize(step, ratio);
						});
					}
					
					me.$el.find('.image-edit-resize').hide();
				}
			
			}, 100);

			return control;
		},
		
		buttonIncreaseSize: function(step, ratio) {
			var me = this,
				canvas = this.$('#uimage-canvas'),
				handler = this.$('#uimage-drag-handle')
			;
			
			var size = this.options.size,
				newWidth = this.invert ? size.height + step : size.width + step,
				newHeight = this.invert ? size.width + step : size.height + step;
 
			canvasSize = {
				width: (newWidth),
				height: (newWidth / ratio)
			};

			this.options.size = canvasSize;
			canvas.css(canvasSize);
			handler.css(canvasSize);
			this.selectMode(canvasSize, true);
			this.setImageSize(canvasSize);
		},
		
		buttonDecreaseSize: function(step, ratio) {
			var me = this,
				canvas = this.$('#uimage-canvas'),
				handler = this.$('#uimage-drag-handle')
			;
			
			var size = this.options.size,
				newWidth = this.invert ? size.height - step : size.width - step,
				newHeight = this.invert ? size.width - step : size.height - step;
 
			canvasSize = {
				width: (newWidth),
				height: (newWidth / ratio)
			};
			
			this.options.size = canvasSize;
			canvas.css(canvasSize);
			handler.css(canvasSize);
			this.selectMode(canvasSize, true);
			this.setImageSize(canvasSize);
		},

		pointAlignment: function(e) {
			var element = $(e.target),
				position = element.data('alignment');

			this.$el.find('.image-align-point').removeClass('active-alignment-point');
			element.addClass('active-alignment-point');
			
			var pos_array = position.split('-');

			this.setAlign(pos_array[1], pos_array[0]);
			
			this.isDotAlign = true;
		},
		
		setDotAlignment: function() {
			this.higlighActiveDot();
			
			if(this.isDotAlign === 'true') {
				this.setAlign(this.align, this.valign);
			}
		},
		
		higlighActiveDot: function() {
			//First remove all highlights
			this.$el.find('.image-align-point').removeClass('active-alignment-point');
			
			//Highlight the active dot if isDotAlign true
			if(typeof this.isDotAlign !== "undefined" && this.isDotAlign === 'true') {
				var activeDot = this.$el.find('.'+ this.valign +'-'+ this.align +'-point');

				if(activeDot.length) {
					activeDot.addClass('active-alignment-point');
				}
			}
		},

		open: function(options){
			// When image element is bigger than image it contains mask will be smaller than element.
			// If than user uploads bigger image in that image element mask should expand to element
			// size so that new image will not be cut off in image element.
			if (options.maskSize && options.editElement && options.editElement.elementSize && // safe guards
					options.maskSize.height < options.editElement.elementSize.height &&
					options.editElement.elementSize.height < options.fullSize.height) {
				options.maskSize.width = options.editElement.elementSize.width + 2;
				options.maskSize.height = options.editElement.elementSize.height;
			}
			
			this.resetDefaults();
			this.options = options;
			this.src = options.src;
			this.saveOnClose = options.saveOnClose;

			options.maskOffset.top += this.fixImageTop(options.maskOffset);

			this.setOptions(options);

			var resizedElement = this.maybeResizeElement(options);
			if(resizedElement){
				options.position = {top: 0, left: 0};
				options.maskSize = resizedElement.maskSize;
				options.size = resizedElement.imageSize;
				options.setImageSize = false;
				options.align = 'left';
				options.resizedElement = true;

				return this.open(options);
			}

			if(!this.options.editElement) {
				this.buttons = [{id: 'image-edit-button-ok', text: l10n.btn.save_label, tooltip: l10n.btn.save_info}];
			}

			var halfBorder = this.bordersWidth /2,
				maskOffset = {
					top: parseInt(options.maskOffset.top, 10) - halfBorder,
					left: parseInt(options.maskOffset.left, 10) - halfBorder
				},
				maskSize = {
					width: parseInt(options.maskSize.width, 10) + this.bordersWidth,
					height: parseInt(options.maskSize.height, 10) + this.bordersWidth
				}
			;

			if(!options.position) {
				options.position = this.centerImageOffset(options.size, maskSize);
			}

			var canvasOffset = {
					top: parseInt(maskOffset.top, 10) - options.position.top + halfBorder,
					left: parseInt(maskOffset.left, 10) - options.position.left + halfBorder
				},
				canvasSize = {
					width: parseInt(options.size.width, 10),
					height: parseInt(options.size.height, 10)
				}
			;

			this.imageId = options.id;
			this.src = options.srcOriginal;

			this.fullSize = options.fullSize;
			if(options.align) {
				this.align = options.align;
			}
			
			if(options.valign) {
				this.valign = options.valign;
			}
			
			if(options.isDotAlign) {
				this.isDotAlign = options.isDotAlign;
			}

			if(this.setImageInitialSize){
				var fullImageProps = this.getFullWidthImage();
				canvasSize = fullImageProps.size;
				canvasOffset.left = fullImageProps.left;
			}
			else if(options.imageFit){
				canvasSize = this.initialImageSize(0, false, maskSize);
			}

			var tplOptions = {
				size: canvasSize,
				offset: canvasOffset,
				maskOffset: maskOffset,
				rotation: 'rotate_' + this.rotation,
				src: this.src,
				maskSize: maskSize,
				buttons: this.buttons,
				fitMask: options.fitMaskColumns
			};

			this.$el.html(this.tpl(tplOptions)).find('div').hide();
			if(!this.$el.closest('body').length){
				this.response = $.Deferred();
				$('body').append(this.$el);
			}

			imageControl = this.createImageControl(options);

			this.$el.find('#image-edit-buttons').prepend($('<div class="uimage-edit-controls upfront-ui"></div>').append(imageControl.$el));

			this.addGridLines(maskOffset.top, maskSize.height);

			this.$el.css({
				height: $(document).height(),
				width: $(document).width()
			}).find('div').fadeIn(200);

			this.selectMode(canvasSize);
			this.startEditorUI();
			this.selectMode(canvasSize, true);

			this.setImageSize(canvasSize);
			
			this.setDotAlignment();

			//this.setAlign(this.align);
			this.$('#image-edit-button-align').addClass('align-' + this.align);

			if(this.setImageInitialSize){
				this.resetImage(false, false);
			}

			if(options.editElement){
				this.check100ButtonActivation();
			}

			return this.response.promise();
		},

		setOptions: function(options) {
			var me = this;
			if(typeof options.rotation !== 'undefined') {
				this.setRotation(options.rotation);
			} else {
				this.setRotation(0);
			}

			if(options.setImageSize) {
				this.setImageInitialSize = true;
			}

			if(options.extraButtons && options.extraButtons.length){
				_.each(options.extraButtons, function(button){
					me.buttons.push({id: button.id, text: button.text});
					me.$el
						.off('click', '#' + button.id)
						.on('click', '#' + button.id, function(e){
							button.callback(e, me);
						})
					;
				});
			}
			this.element_id = options.element_id || false;
		},

		check100ButtonActivation: function(){
			var full = this.getFullWidthImage(this.options.fullSize).size,
				fullColsRows = this.getCurrentImageRowsCols(full.width, full.height),
				fullWidth = this.options.fullSize,
				button = this.$('#image-edit-button-reset'),
				canvas = this.$('#uimage-canvas')
			;

			if(typeof this.options.fullSize === "undefined" || !this.options.fullSize) {
				//Make sure we have size for natural size
				fullWidth = full;
			}
			
			if(fullWidth.width === canvas.width() && fullWidth.height === canvas.height()) {
				button.find('input').prop('disabled', true);
				button.addClass('image-reset-disabled');
			}
		},

		/**
		 * Return the new mask size if the element could be resized in order to fit the current image.
		 * Also it iset the elementSize property.
		 * @param  {Object} options
		 * @return {Mixed} False if the current size is ok or the {width, height} hash if it can be improved
		 */
		maybeResizeElement: function(options, stretch){
			if(!options.editElement) {
				return false;
			}
			
			var elementView = options.editElement,
				elementSize = {
					maxColumns: elementView.get_element_max_columns(),
					maxRows: elementView.get_element_max_rows(),
					rowHeight: breakpointColumnPadding
				}
			;
			
			if(!elementSize.maxRows) {
				elementSize.maxRows = elementView.get_element_rows();
			}

			elementSize.columnWidth = elementView.get_element_max_columns_px() / elementSize.maxColumns;

			elementSize.rows = Math.round(options.maskSize.height / breakpointColumnPadding) + 2;
			elementSize.columns = Math.ceil(options.maskSize.width / elementSize.columnWidth);

			this.elementSize = elementSize;
			
			// If the image is not new we are done
			if(!options.setImageSize) {
				return false;
			}

			var fullGrid = this.getFullWidthImage(options.fullSize).size,
				current = this.getCurrentImageRowsCols(fullGrid.width, fullGrid.height),
				maskSize = {
					width: current.columns * this.elementSize.columnWidth - (2 * breakpointColumnPadding),
					height: (current.rows - 2) * this.elementSize.rowHeight
				}
			;
			
			if(current.columns > elementSize.columns || current.rows > elementSize.rows) {
				return false;
			}

			if(!stretch){
				maskSize = {
					width: Math.max(current.columns, elementSize.columns) * elementSize.columnWidth - (2 * breakpointColumnPadding),
					height: (Math.min(current.rows, elementSize.rows) - 2) * breakpointColumnPadding
				};
			}
			else if(this.elementSize.maxColumns < current.columns){
				var maskWidth = this.elementSize.maxColumns * this.elementSize.columnWidth - (2 * breakpointColumnPadding);
				maskSize = {
					width:  maskWidth,
					height: fullGrid.height
				};
			}

			return {
				maskSize: maskSize,
				imageSize: fullGrid
			};
		},

		imageOk: function() {
			var results = this.getEditorResults(),
				me = this,
				loading = new Upfront.Views.Editor.Loading({
					loading: l10n.saving,
					done: l10n.saving_done,
					fixed: false
				}),
				mask = this.$('#uimage-mask')
			;

			if(results.imageId){
				loading.render();
				mask.append(loading.$el);
				this.saveImageEdition(
					results.imageId,
					results.rotation,
					results.imageSize,
					{
						top: results.imageOffset.top,
						left: results.imageOffset.left,
						width: results.maskSize.width,
						height: results.maskSize.height
					}
				)
				.done(function(result){
					var imageData = result.data.images[results.imageId];

					loading.done();

					if(imageData.error){
						Upfront.Views.Editor.notify('Image failed to process. ' + imageData.msg, 'error', 15*1000);
						me.close();
						return;
					}

					results.src = imageData.url;
					results.srcFull = imageData.urlOriginal;
					results.cropSize = imageData.crop;
					results.gif = imageData.gif || 0;
					if(me.options.resizedElement) {
						results.elementSize = me.getCurrentMaskRowsCols();
					}
					me.response.resolve(results);
					me.close();
				});
			}
		},

		close: function(reason) {
			var me = this;
			this.unfixImageTop();
			this.$('div').fadeOut(200, function(){
				me.$el.detach();
			});
			this.options = false;
			me.response.reject({reason: reason, id: this.imageId});
		},

		cancel: function(reason){
			this.close(reason);
		},

		changeImage: function(){
			this.close('changeImage');
		},

		getEditorResults: function() {
			var canvas = this.$('#uimage-canvas'),
				img = canvas.find('img'),
				mask = this.$('#uimage-mask'),
				src = img.attr('src'),
				halfBorder = this.bordersWidth / 2
			;
			
			return {
				imageSize: {width: Math.round(this.invert ? img.height() : img.width()), height: Math.round(this.invert ? img.width() : img.height())},
				imageOffset: {
					top: mask.offset().top - canvas.offset().top + halfBorder,
					left: mask.offset().left - canvas.offset().left + halfBorder
				},
				maskSize: {
					width: mask.width(),
					height: mask.height()
				},
				rotation: this.rotation,
				imageId: this.imageId,
				fullSize: this.fullSize,
				srcOriginal: src,
				align: this.align,
				valign: this.valign,
				isDotAlign: this.isDotAlign,
				stretch : this.mode === 'big' || this.mode === 'horizontal',
				vstretch: this.mode === 'big' || this.mode === 'vertical',
				mode: this.mode
			};
		},

		rotate: function(e){
			var rotation = this.rotation,
				img = this.$('.uimage-img'),
				rotationClass = '',
				size = {width: img.width(), height: img.height()},
				canvas = this.$('#uimage-canvas'),
				handler = this.$('#uimage-drag-handle')
			;

			if(e){
				e.preventDefault();
				e.stopPropagation();
			}

			rotation = rotation === 270 ? 0 : rotation + 90;

			if(rotation) {
				rotationClass = 'rotate_' + rotation;
			}

			img.removeClass()
				.addClass('uimage-img ' + rotationClass);

			this.setRotation(rotation);

			if(this.invert){
				canvas.css({
					height: size.width,
					width: size.height
				});
				handler.css({
					height: size.width,
					width: size.height
				});
				img.css({
					height: size.height,
					width: size.width
				});
				//$('#uimage-drag-handle').resizable('option', 'aspectRatio', size.height / size.width);
			}
			else{
				canvas.css(size);
				handler.css(size);
				img.css({
					height: '100%',
					width: '100%'
				});
				//$('#uimage-drag-handle').resizable('option', 'aspectRatio', size.width / size.height);
			}

			img.css(this.imgOffset({width: img.width(), height: img.height()}));

			this.selectMode({width: canvas.width(), height: canvas.height()});

			//this.centerImage(true);

			$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());
			this.setResizingLimits();
		},

		setRotation: function(rotation){
			this.rotation = rotation;
			this.invert = [90,270].indexOf(rotation) !== -1;
		},

		imgOffset: function(size) {
			if(! this.invert) {
				return {top: 0, left: 0};
			}
			return {
				top: Math.floor((size.width - size.height) / 2),
				left: Math.floor((size.height - size.width) / 2)
			};
		},

		startEditorUI: function() {
			var me = this,
				canvas = this.$('#uimage-canvas')
			;
			$('#uimage-drag-handle')
				.resizable({
					handles: {se: $('.image-edit-resize i')},
					autoHide: 0,
					aspectRatio: true, //(me.fullSize.width + me.bordersWidth) / (me.fullSize.height + me.bordersWidth),
					start: function() {
						me.$('#image-edit-button-reset')
							.attr('class', 'image-crop-edit-button image-edit-col-full')
							.attr('title', l10n.btn.exp_info)
							.find('input').prop('disabled', false)
						;
						//Prevent editor closing after resizing. It is set to false by the initialize method.
						me.isResizing = true;
					},
					resize: function(e, ui){
						canvas.css(ui.size);
						me.setImageSize(ui.size);
					},
					stop: function(e, ui){
						var dragHandle = me.$('#uimage-drag-handle');
						e.preventDefault();
						//Recalculate dimensions from the original size
						var imageSize = {
								width: (me.invert ? ui.size.height : ui.size.width),
								height: (me.invert ? ui.size.width : ui.size.height)
							},
							factor = me.fullSize.width / Math.floor(imageSize.width),
							canvasSize
						;
						imageSize = {
							width: Math.floor(imageSize.width),
							height: Math.round(me.fullSize.height / factor)
						};

						canvasSize = {
							width: (me.invert ? imageSize.height : imageSize.width),
							height: (me.invert ? imageSize.width : imageSize.height)
						};

						canvas.css(canvasSize);
						dragHandle.css(canvasSize);
						me.selectMode(canvasSize, true);
						me.setImageSize(canvasSize);
						if(me.mode === 'small' || me.mode === 'vertical') {
							me.centerImage(false);
						}

						$('#uimage-drag-handle').draggable('option', 'containment', me.getContainment());
					}
				})
				.draggable({
					opacity:1,
					start: function(){
						//Prevent editor closing during cropping. It is set to false by the initialize method.
						me.isDragged = true;

						//Update dots when we drag the image
						me.isDotAlign = false;
						
						me.higlighActiveDot();
					},
					drag: function(e, ui){
						canvas.css({
							top: ui.position.top,
							left: ui.position.left
						});
						// Set position dots on drag
						me.setAlignDotsOnDrag(ui.position.top, ui.position.left);
					},
					stop: function(e, ui){
						canvas.css({
							top: ui.position.top,
							left: ui.position.left
						});
						me.setResizingLimits();
					},
					containment: me.getContainment()
				})
			;
			me.setResizingLimits();

		},
		
		setAlignDotsOnDrag: function(top, left) {
			limits = this.getContainment(),
			limitRight = limits[0],
			limitBottom = limits[1],
			limitLeft = limits[2],
			limitTop = limits[3];
			
			// Image is top left
			if(limitLeft === left && limitTop === top) {
				this.setDotAlignPosition('top', 'left');
			}
			
			// Image is top right
			if(limitRight === left && limitTop === top) {
				this.setDotAlignPosition('top', 'right');
			}
			
			// Image is bottom left
			if(limitLeft === left && limitBottom === top) {
				this.setDotAlignPosition('bottom', 'left');
			}
			
			// Image is bottom right
			if(limitRight === left && limitBottom === top) {
				this.setDotAlignPosition('bottom', 'right');
			}
		},
		
		setDotAlignPosition: function(valign, align) {
			// Make sure we call it only once
			if(this.align !== align || this.valign !== valign) {
				this.isDotAlign = true;
				this.align = align;
				this.valign = valign;
				this.higlighActiveDot();
			}
		},

		addGridLines: function(initialPoint, maskHeight){
			var step = breakpointColumnPadding,
				height = maskHeight - this.bordersWidth,
				current = this.bordersWidth / 2
			;

			while(current <= height + step){
				this.$el.append('<div class="gridline" style="position: absolute;width: 100%; height: 0; top:' + (initialPoint + current) + 'px"></div>');
				current = current + step;
			}
		},

		selectMode: function(size, constraints) {
			var mode = 'small',
				mask = this.$('#uimage-mask'),
				maskSize = {
					width: mask.width(),
					height: mask.height()
				}
			;

			if(size.width >= maskSize.width){
				if(size.height >= maskSize.height) {
					mode = 'big';
				} else {
					mode = 'horizontal';
				}
			} else if(size.height >= maskSize.height) {
				mode = 'vertical';
			}

			this.setMode(mode, constraints);
		},

		setMode: function(mode, constraints){
			var editor = $('#uimage-drag-handle'),
				centerImage = (mode === 'small' || mode === 'vertical') && mode !== this.mode
			;
			this.$el
				.removeClass('uimage-mode-big uimage-mode-small uimage-mode-vertical uimage-mode-horizontal uimage-mode-tiny')
				.addClass('uimage-mode-' + mode)
			;
			if(editor.width() < 40 || editor.height() < 40) {
				this.$el.addClass('uimage-mode-tiny');
			}

			this.mode = mode;
			if(constraints){
				if(this.mode === 'horizontal' || this.mode === 'small') {
					editor.draggable('option', {snap: '.gridline', snapMode: 'outer', snapTolerance: 6});
				} else {
					editor.draggable('option', {snap: false});
				}
			}

			if(centerImage){
				this.centerImage(false);
			}

		},

		setImageSize: function(size){
			if(this.invert){
				var invertSize = {
					width: size.height,
					height: size.width
				};

				this.$('.uimage-img')
					.css(invertSize)
					.css(this.imgOffset(invertSize))
				;
			}
		},

		getContainment: function(){
			var canvas = this.$('#uimage-canvas'),
				mask = this.$('#uimage-mask'),
				initPoint = mask.offset(),
				halfBorder = this.bordersWidth / 2
			;


			if(this.mode === 'big'){
				return [
					initPoint.left - canvas.width() + mask.width() + halfBorder,
					initPoint.top - canvas.height() + mask.height() + halfBorder,
					initPoint.left + halfBorder,
					initPoint.top + halfBorder
				];
			}
			if(this.mode === 'horizontal') {
				return [
					initPoint.left - canvas.width() + mask.width() + halfBorder,
					initPoint.top,
					initPoint.left + halfBorder,
					initPoint.top - canvas.height() + mask.height()
				];
			}

			var left = this.align === 'left' ? initPoint.left: (this.align === 'right' ? initPoint.left + mask.width() - canvas.width() : initPoint.left + (mask.width() - canvas.width()) / 2);
			left += halfBorder;

			if(this.mode === 'vertical') {
				return [
					left,
					initPoint.top - canvas.height() + mask.height() + halfBorder,
					left,
					initPoint.top + halfBorder
				];
			}

			return [
				left,
				initPoint.top,
				left,
				initPoint.top - canvas.height() + mask.height()
			];
		},

		setResizingLimits: function() {
			var canvas = this.$('#uimage-canvas'),
				mask = this.$('#uimage-mask'),
				initPoint = mask.offset(),
				limits = {
					minWidth: breakpointColumnPadding,
					minHeight: breakpointColumnPadding
				}
			;
			if(this.mode === 'big'){
				limits = {
					minWidth: mask.width() + initPoint.left - canvas.offset().left + this.bordersWidth,
					minHeight: mask.height() + initPoint.top - canvas.offset().top + this.bordersWidth
				};
			}

			$('#uimage-drag-handle').resizable('option', limits);
		},

		resetImage: function(e, alert){
			if(e){
				e.preventDefault();
				e.stopPropagation();
			}
			this.setRotation(270);
			this.rotate(); //Set rotation to 0
			this.setImageFullSize(e, alert);
			this.centerImage(true);
		},

		image100: function(e){
			var fullGrid = this.getFullWidthImage(this.options.fullSize).size,
				current = this.getCurrentImageRowsCols(fullGrid.width, fullGrid.height),
				fullWidth = this.options.fullSize,
				maskSize = current
			;
			
			//if(this.elementSize.maxColumns < current.columns){
				var maskHeight = fullGrid.height;
				maskSize = {columns: this.elementSize.maxColumns, rows: Math.ceil(maskHeight / this.elementSize.rowHeight) + 2};
			//}

			// Don't allow changing width mask size anymore
			maskSize.columns = this.elementSize.maxColumns;
			
			if(typeof this.options.fullSize === "undefined" || !this.options.fullSize) {
				//Make sure we have size for natural size
				fullWidth = fullGrid;
			}

			//Prevent resize mask dimensions
			//
			//if(maskSize.columns !== this.elementSize.columns || maskSize.rows !== this.elementSize.rows) {
			//	this.resizeMask(maskSize.columns, maskSize.rows);
			//} else{
			//	var maskOffset = this.$('#uimage-mask').offset();
			//	fullGrid.top = maskOffset.top;
			//	fullGrid.left = maskOffset.left;
			//	this.$('#uimage-canvas').css(fullGrid);
			//	this.$('#uimage-drag-handle').css(fullGrid);
			//}

			var maskOffset = this.$('#uimage-mask').offset();
			fullGrid.top = maskOffset.top;
			fullGrid.left = maskOffset.left;
			this.$('#uimage-canvas').css(fullWidth);
			this.$('#uimage-drag-handle').css(fullWidth);

			if(maskSize.columns !== 22 && current.columns > maskSize.columns) {
				this.showExpandAlert();
			}
			
			//We should set dots to center
			this.align = this.valign = 'center';
			this.higlighActiveDot();

			//Set image centered on Natural
			this.setAlign('center', 'center');
			
			this.check100ButtonActivation();
		},

		getCurrentImageRowsCols: function(width, height){
			var img = this.$('#uimage-canvas'),
				imgWidth = width ? width : img.width(),
				imgHeight = height ? height : img.height()
			;

			return {
				rows: Math.ceil(imgHeight / this.elementSize.rowHeight) + 2,
				columns: Math.ceil((imgWidth + (2 * breakpointColumnPadding))/ this.elementSize.columnWidth)
			};
		},

		getCurrentMaskRowsCols: function(){
			var mask = this.$('#uimage-mask');
			return this.getCurrentImageRowsCols(mask.width(), mask.height());
		},

		showExpandAlert: function(){
			if(this.ignoreFullwidthAlert) {
				return;
			}
			var me = this;
			Upfront.Popup.open(function(){}, {width: 320}, 'warning_img')
				.progress(function(progress){
					if(progress === 'before_close') {
						me.ignoreFullwidthAlert = $('#upfront-popup-content').find('input:checked').length;
					}
				})
			;

			$('#upfront-popup-content')
				.append(_.template($(editorTpl).find('#fullwidth-alert-tpl').html(), {l10n: l10n.template}));
		},

		resizeMask: function(columns, rows){
			var options = this.options;

			options.maskSize = {
				width: this.elementSize.columnWidth * columns - (2 * breakpointColumnPadding),
				height: this.elementSize.rowHeight * (rows - 2)
			};

			options.size = this.getFullWidthImage().size;
			options.position = {left: 0, top: 0};
			options.setImageSize = false;
			options.resizedElement = true;

			this.open(options);
		},
		
		clearDotAlign: function(center) {
			this.isDotAlign = false;
			this.$el.find('.image-align-point').removeClass('active-alignment-point');

			if(center === true) {
				this.setAlign('center', 'center');
			}
		},

		fitImage: function(){
			var canvas = this.$('#uimage-canvas'),
				mask = this.$('#uimage-mask'),
				handler = this.$('#uimage-drag-handle'),
				size = this.getResizeImageDimensions(this.fullSize, {width: mask.width(), height: mask.height()}, 'inner', 0)
			;

			if(this.invert){
				size = {
					width: size.height,
					height: size.width
				};
			}

			canvas.css(size);
			handler.css(size);

			this.setImageSize(size);
			this.centerImage(true);

			this.selectMode(size, true);

			this.centerImage(true);

			this.setResizingLimits();
			
			this.clearDotAlign(true);

			$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());

			$('#image-edit-button-reset')
				.attr('class', 'image-crop-edit-button image-edit-col-full')
				.attr('title', l10n.btn.exp_info)
				.find('input').prop('disabled', false)
			;
		},

		//TODO: remove this. This method is deprecated, since the fit mask button is not used anymore
		fitMask: function(){
			var canvas = $('#uimage-canvas'),
				mask = $('#uimage-mask'),
				columnWidth = Math.round((mask.width() + (2 * breakpointColumnPadding)) / this.options.fitMaskColumns),
				canvasSize = {width: canvas.width(), height: canvas.height()},
				rowHeight = breakpointColumnPadding,
				elementColumns = Math.ceil((canvasSize.width + (2 * breakpointColumnPadding)) / columnWidth),
				maskNewSize = {
					height: Math.ceil(canvasSize.height / rowHeight) * rowHeight,
					width: elementColumns * columnWidth - (2 * breakpointColumnPadding)
				},
				optionsNew = this.options
			;

			optionsNew.position = {top: 0, left: 0};
			optionsNew.size = canvasSize;
			optionsNew.maskSize = maskNewSize;
			optionsNew.align = 'left';
			optionsNew.setImageSize = false;
			optionsNew.rotation = this.rotation;
			optionsNew.elementColumns = elementColumns;

			this.open(optionsNew);
		},

		fillImage: function(){
			var canvas = this.$('#uimage-canvas'),
				mask = this.$('#uimage-mask'),
				handler = this.$('#uimage-drag-handle'),
				size = this.getResizeImageDimensions(this.fullSize, {width: mask.width(), height: mask.height()}, 'outer', 0)
				//size = this.initialImageSize(0, false, {width: mask.width(), height: mask.height()})
			;

			if(this.invert){
				size = {
					width: size.height,
					height: size.width
				};
			}

			canvas.css(size);
			handler.css(size);

			this.setImageSize(size);
			this.centerImage(true);

			this.selectMode(size, true);

			this.centerImage(true);

			this.setResizingLimits();
			
			this.clearDotAlign(true);

			$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());

			$('#image-edit-button-reset')
				.attr('class', 'image-crop-edit-button image-edit-col-full')
				.attr('title', l10n.btn.exp_info)
				.find('input').prop('disabled', false)
			;
		},

		setImageFullSize: function(e) {
			if(e) {
				e.preventDefault();
			}

			var img = this.$('.uimage-img'),
				mask = this.$('#uimage-mask'),
				canvas = this.$('#uimage-canvas'),
				handle = this.$('#uimage-drag-handle'),
				size = this.initialImageSize(100, false, {width: mask.width(), height: mask.height()})
			;

			canvas.css(size);
			handle.css(size);

			img.css({
				height: '100%',
				width: '100%'
			});

			this.selectMode(size, true);

			this.setResizingLimits();
			$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());
		},

		centerImage: function(vertical) {
			var canvas = this.$('#uimage-canvas'),
				mask = this.$('#uimage-mask'),
				handle = this.$('#uimage-drag-handle'),
				border = this.bordersWidth / 2,
				position = {
					top: canvas.offset().top
				}
			;
			if(vertical) {
				position.top = mask.offset().top - ((canvas.height() - mask.height()) / 2) + border;
			}

			if((this.mode !== 'vertical' && this.mode !== 'small') || this.align === 'center') {
				position.left = mask.offset().left - ((canvas.width() -  mask.width()) / 2);
			} else if(this.align === 'left') {
				position.left = mask.offset().left;
			} else {
				position.left = mask.offset().left + mask.width() - canvas.width();
			}

			position.left += border;

			canvas.css(position);
			handle.css(position);
		},

		getFullWidthImage: function(fullSize) {
			var grid = $(document.querySelector('.upfront-grid-layout')),
				gridWidth = grid.width() - (2 * breakpointColumnPadding),
				size = fullSize || this.fullSize
			;
			
			// to avoid using upfront-grid-layout with no content
			if ( this.options ) {
                if ( this.options.editElement ) {
                    var objectView = this.options.editElement.$el;
                    grid = objectView.parents('.upfront-grid-layout');
                    gridWidth = grid.width() - (2 * breakpointColumnPadding);
                }
            } 

			if(size.width > gridWidth) {
				size = {width: gridWidth, height: Math.round(size.height / (size.width / gridWidth))};
			}


			return {
				size: size,
				left: grid.offset().left + breakpointColumnPadding
			};
		},

		initialImageSize: function(overflow, stretch, maskDimensions) {
			var mask = this.$('#uimage-mask'),
				size = {
					width: 0,
					height: 0
				},
				maskSize = maskDimensions ? maskDimensions : {
					width: mask.width(),
					height: mask.height()
				},
				pivot, factor, invertPivot,
				stretchImage = !!stretch
			;

			//prevent strange behaviors
			overflow = overflow ? overflow : 0;

			//this.fullSize = this.getImageFullSize();

			pivot = maskSize.width / maskSize.height < this.fullSize.width / this.fullSize.height ? 'height' : 'width';
			invertPivot = this.invert ? (pivot === 'width' ? 'height' : 'width') : pivot;

			factor = this.fullSize[pivot] / (maskSize[invertPivot] + overflow);

			if(!stretchImage && factor < 1) {
				size = this.fullSize;
			} else {
				size = {
					width: Math.ceil(this.fullSize.width / factor),
					height: Math.ceil(this.fullSize.height / factor)
				};
			}

			return size;
		},

		getResizeImageDimensions: function(imageDim, wrapperDim, fittingType, overflow){
			var imageFactor = imageDim.width / imageDim.height,
				wrapperFactor = wrapperDim.width / wrapperDim.height,
				type = fittingType && fittingType === 'outer' ? 'outer' : 'inner',
				pivot = type === 'inner'  ? (imageFactor > wrapperFactor ? 'width' : 'height') : (imageFactor > wrapperFactor ? 'height' : 'width'),
				padding = overflow || 0,
				targetDim = wrapperDim[pivot] + padding
			;
	/*
			if(imageDim[pivot] <= targetDim)
				return imageDim;
	*/
			var factor = targetDim / imageDim[pivot];

			return {width: Math.round(imageDim.width * factor), height: Math.round(imageDim.height * factor)};
		},

		getImageData: function(ids, customImageSize, element_id) {
			var options = {
					action: 'upfront-media-image_sizes',
					item_id: JSON.stringify(ids),
					element_id: element_id
				};

			if(customImageSize) {
				options.customSize = customImageSize;
			}

			return Upfront.Util.post(options);
		},

		saveImageEdition: function(imageId, rotate, resize, crop){
			var opts = {
					action: 'upfront-media-image-create-size',
					images: [{
						element_id: this.element_id,
						id: imageId,
						rotate: rotate,
						resize: resize,
						crop: crop
					}]
				}
			;

			return Upfront.Util.post(opts);
		},
		selectAlign: function(){
			if(this.align === 'left') {
				this.setAlign('center');
			} else if(this.align === 'center') {
				this.setAlign('right');
			} else if(this.align === 'right') {
				this.setAlign('left');
			}
		},

		setAlign: function(direction_h, direction_v){
			var mask = this.$('#uimage-mask'),
				canvas = this.$('#uimage-canvas'),
				handle = this.$('#uimage-drag-handle'),
				position = canvas.position()
			;

			this.$('#image-edit-button-align').removeClass('align-left align-right align-center').addClass('align-' + direction_h);

			if(direction_h !== 'left' && direction_h !== 'center' && direction_h !== 'right') {
				return false;
			}
			
			if(direction_v !== 'top' && direction_v !== 'center' && direction_v !== 'bottom') {
				return false;
			}
			
			this.align = direction_h;
			
			if(this.align === 'center') {
				position.left = mask.offset().left - ((canvas.width() -  mask.width()) / 2);
			} else if(this.align === 'left') {
				position.left = mask.offset().left;
			} else {
				position.left = mask.offset().left + mask.width() - canvas.width();
			}
			
			this.valign = direction_v;
			
			if(typeof direction_v !== "undefined") {
				if(direction_v === 'center') {
					position.top = mask.offset().top - ((canvas.height() -  mask.height()) / 2);
				} else if(direction_v === 'top') {
					position.top = mask.offset().top;
				} else {
					position.top = mask.offset().top + mask.height() - canvas.height();
				}
			}

			position.left += this.bordersWidth / 2;

			canvas.css(position);
			handle.css(position);

			this.$('#uimage-drag-handle').draggable('option', 'containment', this.getContainment());
		},

		keyMove: function(e) {
			switch(e.which){
				case 40: //down
					this.maskOffset.top--;
					this.positionEditorElements();
					break;
				case 39: //right
					this.maskOffset.left--;
					this.positionEditorElements();
					break;
				case 37: //left
					this.maskOffset.left++;
					this.positionEditorElements();
					break;
				case 38: //up
					this.maskOffset.top++;
					this.positionEditorElements();
			}
		},

		fixImageTop: function(offset){
			if(offset && typeof offset.top !== 'undefined'){
				if(offset.top < 120){
					var margin = $('body').css('marginTop');
					margin = parseInt(margin.replace('px', ''), 10);
					if(!isNaN(margin)){
						this.fixTop = 120 - offset.top;
						$('body').css(('marginTop'), margin + this.fixTop);
						return this.fixTop;
					}
				}
			}
			return 0;
		},

		unfixImageTop: function(){
			if(this.fixTop){
				var margin = $('body').css('marginTop');
				margin = parseInt(margin.replace('px', ''), 10);
				if(!isNaN(margin)){
					$('body').css(('marginTop'), margin - this.fixTop);
				}
				this.fixTop = 0;
			}
		}
	});

	return ImageEditor;
});
})(jQuery);
