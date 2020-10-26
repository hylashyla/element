<script>
import UploadList from './upload-list';
import Upload from './upload';
import ElProgress from 'element-ui/packages/progress';
import Migrating from 'element-ui/src/mixins/migrating';

function noop() {}

export default {
  name: 'ElUpload',

  mixins: [Migrating],

  components: {
    ElProgress,
    UploadList,
    Upload
  },

  provide() {
    return {
      uploader: this
    };
  },

  inject: {
    elForm: {
      default: ''
    }
  },

  props: {
    action: {
      type: String,
      required: true
    },
    headers: {
      type: Object,
      default() {
        return {};
      }
    },
    data: Object,
    multiple: Boolean,
    name: {
      type: String,
      default: 'file'
    },
    drag: Boolean,
    dragger: Boolean,
    withCredentials: Boolean,
    showFileList: {
      type: Boolean,
      default: true
    },
    accept: String,
    type: {
      type: String,
      default: 'select'
    },
    beforeUpload: Function,
    beforeRemove: Function,
    onRemove: {
      type: Function,
      default: noop
    },
    onChange: {
      type: Function,
      default: noop
    },
    onPreview: {
      type: Function
    },
    onSuccess: {
      type: Function,
      default: noop
    },
    onProgress: {
      type: Function,
      default: noop
    },
    onError: {
      type: Function,
      default: noop
    },
    fileList: {
      type: Array,
      default() {
        return [];
      }
    },
    autoUpload: {
      type: Boolean,
      default: true
    },
    listType: {
      type: String,
      default: 'text' // text,picture,picture-card
    },
    httpRequest: Function,
    disabled: Boolean,
    limit: Number,
    onExceed: {
      type: Function,
      default: noop
    }
  },

  data() {
    return {
      uploadFiles: [],
      dragOver: false, // 未使用
      draging: false, // 未使用
      tempIndex: 1
    };
  },

  computed: {
    uploadDisabled() {
      return this.disabled || (this.elForm || {}).disabled;
    }
  },

  watch: {
    listType(type) {
      // 图片
      if (type === 'picture-card' || type === 'picture') {
        this.uploadFiles = this.uploadFiles.map(file => {
          if (!file.url && file.raw) {
            try {
              file.url = URL.createObjectURL(file.raw);
            } catch (err) {
              console.error('[Element Error][Upload]', err);
            }
          }
          return file;
        });
      }
    },
    fileList: {
      immediate: true, // 第一次绑定值时也触发
      handler(fileList) {
        this.uploadFiles = fileList.map(item => {
          item.uid = item.uid || (Date.now() + this.tempIndex++);
          item.status = item.status || 'success';
          return item;
        });
      }
    }
  },

  methods: {
    // 开始上传文件
    handleStart(rawFile) {
      rawFile.uid = Date.now() + this.tempIndex++;
      let file = {
        status: 'ready',
        name: rawFile.name,
        size: rawFile.size,
        percentage: 0,
        uid: rawFile.uid,
        raw: rawFile
      };

      if (this.listType === 'picture-card' || this.listType === 'picture') {
        try {
          // 创建一个表示File对象的URL，参考：https://developer.mozilla.org/zh-CN/docs/Web/API/URL/createObjectURL
          file.url = URL.createObjectURL(rawFile);
        } catch (err) {
          console.error('[Element Error][Upload]', err);
          return;
        }
      }

      this.uploadFiles.push(file);
      this.onChange(file, this.uploadFiles);
    },
    // 上传进度变化试触发
    handleProgress(ev, rawFile) {
      const file = this.getFile(rawFile);
      this.onProgress(ev, file, this.uploadFiles);
      file.status = 'uploading';
      file.percentage = ev.percent || 0;
    },
    // 上传成功
    handleSuccess(res, rawFile) {
      const file = this.getFile(rawFile);

      if (file) {
        file.status = 'success';
        file.response = res;

        this.onSuccess(res, file, this.uploadFiles);
        this.onChange(file, this.uploadFiles);
      }
    },
    // 上传错误
    handleError(err, rawFile) {
      const file = this.getFile(rawFile);
      const fileList = this.uploadFiles;

      file.status = 'fail';

      fileList.splice(fileList.indexOf(file), 1);

      this.onError(err, file, this.uploadFiles);
      this.onChange(file, this.uploadFiles);
    },
    // 删除文件
    handleRemove(file, raw) {
      if (raw) {
        file = this.getFile(raw);
      }
      let doRemove = () => {
        // 若该文件请求未完成，终止该文件请求
        this.abort(file);
        let fileList = this.uploadFiles;
        // 文件列表中删除该条数据
        fileList.splice(fileList.indexOf(file), 1);
        // 触发文件列表移除文件回调函数
        this.onRemove(file, fileList);
      };

      // 若未提供beforeRemove函数，直接执行doRemove函数
      if (!this.beforeRemove) {
        doRemove();
      } else if (typeof this.beforeRemove === 'function') {
        const before = this.beforeRemove(file, this.uploadFiles);
        // 如果beforeRemove函数执行后返回一个promise,等待promise状态变成resolve再执行doRemove函数
        if (before && before.then) {
          before.then(() => {
            doRemove();
          }, noop);
        } else if (before !== false) {
          doRemove();
        }
      }
    },
    // 获取文件
    getFile(rawFile) {
      let fileList = this.uploadFiles;
      let target;
      fileList.every(item => {
        target = rawFile.uid === item.uid ? item : null;
        return !target;
      });
      return target;
    },
    // 停止请求
    abort(file) {
      this.$refs['upload-inner'].abort(file);
    },
    // 清除文件列表
    clearFiles() {
      this.uploadFiles = [];
    },
    submit() {
      this.uploadFiles
        .filter(file => file.status === 'ready')
        .forEach(file => {
          this.$refs['upload-inner'].upload(file.raw);
        });
    },
    getMigratingConfig() {
      return {
        props: {
          'default-file-list': 'default-file-list is renamed to file-list.',
          'show-upload-list': 'show-upload-list is renamed to show-file-list.',
          'thumbnail-mode': 'thumbnail-mode has been deprecated, you can implement the same effect according to this case: http://element.eleme.io/#/zh-CN/component/upload#yong-hu-tou-xiang-shang-chuan'
        }
      };
    }
  },

  beforeDestroy() {
    this.uploadFiles.forEach(file => {
      if (file.url && file.url.indexOf('blob:') === 0) {
        URL.revokeObjectURL(file.url);
      }
    });
  },

  render(h) {
    let uploadList;

    if (this.showFileList) {
      uploadList = (
        <UploadList
          disabled={this.uploadDisabled}
          listType={this.listType}
          files={this.uploadFiles}
          on-remove={this.handleRemove}
          handlePreview={this.onPreview}>
        </UploadList>
      );
    }

    const uploadData = {
      props: {
        type: this.type,
        drag: this.drag,
        action: this.action,
        multiple: this.multiple,
        'before-upload': this.beforeUpload,
        'with-credentials': this.withCredentials,
        headers: this.headers,
        name: this.name,
        data: this.data,
        accept: this.accept,
        fileList: this.uploadFiles,
        autoUpload: this.autoUpload,
        listType: this.listType,
        disabled: this.uploadDisabled,
        limit: this.limit,
        'on-exceed': this.onExceed,
        'on-start': this.handleStart,
        'on-progress': this.handleProgress,
        'on-success': this.handleSuccess,
        'on-error': this.handleError,
        'on-preview': this.onPreview,
        'on-remove': this.handleRemove,
        'http-request': this.httpRequest
      },
      ref: 'upload-inner'
    };

    const trigger = this.$slots.trigger || this.$slots.default;
    const uploadComponent = <upload {...uploadData}>{trigger}</upload>;

    return (
      <div>
        { this.listType === 'picture-card' ? uploadList : ''}
        {
          this.$slots.trigger
            ? [uploadComponent, this.$slots.default]
            : uploadComponent
        }
        {this.$slots.tip}
        { this.listType !== 'picture-card' ? uploadList : ''}
      </div>
    );
  }
};
</script>
