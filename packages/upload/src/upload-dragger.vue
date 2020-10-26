<template>
  <div
    class="el-upload-dragger"
    :class="{
      'is-dragover': dragover
    }"
    @drop.prevent="onDrop"
    @dragover.prevent="onDragover"
    @dragleave.prevent="dragover = false"
  >
    <slot></slot>
  </div>
</template>
<script>
  export default {
    name: 'ElUploadDrag',
    props: {
      disabled: Boolean
    },
    inject: {
      uploader: {
        default: ''
      }
    },
    data() {
      return {
        dragover: false
      };
    },
    methods: {
      // 当某被拖动的对象在另一对象容器范围内拖动时触发此事件
      onDragover() {
        if (!this.disabled) {
          this.dragover = true;
        }
      },
      // 拖动文件drop时触发
      onDrop(e) {
        if (this.disabled || !this.uploader) return;
        const accept = this.uploader.accept; // uploader是最外层上传组件实例
        this.dragover = false;
        if (!accept) {
          this.$emit('file', e.dataTransfer.files);
          return;
        }
        // 上传文件时，过滤不被接受的文件类型
        this.$emit('file', [].slice.call(e.dataTransfer.files).filter(file => {
          // type（MIME类型），例：image/webp
          const { type, name } = file;
          // 文件扩展名，例：.png
          const extension = name.indexOf('.') > -1
            ? `.${ name.split('.').pop() }`
            : '';
          // image 此处baseType只用于验证audio/*，video/*，image/*，所以正则可以用/\/\*$/
          const baseType = type.replace(/\/.*$/, '');
          return accept.split(',')
            .map(type => type.trim())
            .filter(type => type)
            .some(acceptedType => {
              // 验证文件扩展名
              if (/\..+$/.test(acceptedType)) {
                return extension === acceptedType;
              }
              // 验证audio/*，video/*，image/*
              if (/\/\*$/.test(acceptedType)) {
                return baseType === acceptedType.replace(/\/\*$/, '');
              }
              // 验证MIME type
              if (/^[^\/]+\/[^\/]+$/.test(acceptedType)) {
                return type === acceptedType;
              }
              return false;
            });
        }));
      }
    }
  };
</script>

