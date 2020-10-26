// xhr.status 响应状态码，是标准的HTTP status codes(https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
// xhr.statusText 包含完整的响应状态文本 ex:200 ok
// response 响应实体 返回一个 ArrayBuffer、Blob、Document，或 DOMString，具体是哪种类型取决于 XMLHttpRequest.responseType 的值。
// responseText 响应文本 返回一个DOMString
function getError(action, option, xhr) {
  let msg;
  if (xhr.response) {
    msg = `${xhr.response.error || xhr.response}`;
  } else if (xhr.responseText) {
    msg = `${xhr.responseText}`;
  } else {
    msg = `fail to post ${action} ${xhr.status}`;
  }

  const err = new Error(msg);
  err.status = xhr.status;
  err.method = 'post';
  err.url = action;
  return err;
}

// 获取响应实体
function getBody(xhr) {
  const text = xhr.responseText || xhr.response;
  if (!text) {
    return text;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    // 若text转化成对象错误，返回text
    return text;
  }
}

export default function upload(option) {
  if (typeof XMLHttpRequest === 'undefined') {
    return;
  }

  /**
   * XMLHttpRequest对象用于与服务器交互。可用于更新页面局部内容。
   */
  const xhr = new XMLHttpRequest();
  const action = option.action;

  if (xhr.upload) {
    // 上传进度变化时触发
    xhr.upload.onprogress = function progress(e) {
      if (e.total > 0) {
        e.percent = e.loaded / e.total * 100;
      }
      option.onProgress(e);
    };
  }

  const formData = new FormData();

  if (option.data) {
    Object.keys(option.data).forEach(key => {
      formData.append(key, option.data[key]);
    });
  }

  formData.append(option.filename, option.file, option.file.name);

  // 当请求遭遇错误时触发
  xhr.onerror = function error(e) {
    option.onError(e);
  };

  // 请求成功完成时触发
  xhr.onload = function onload() {
    if (xhr.status < 200 || xhr.status >= 300) {
      return option.onError(getError(action, option, xhr));
    }

    option.onSuccess(getBody(xhr));
  };

  // 初始化请求
  xhr.open('post', action, true);

  if (option.withCredentials && 'withCredentials' in xhr) {
    // 用来指定跨域 Access-Control 请求带有授权信息
    xhr.withCredentials = true;
  }

  // 设置 HTTP 请求头的值用来指定跨域 Access-Control 请求是否应当带有授权信息
  const headers = option.headers || {};

  for (let item in headers) {
    if (headers.hasOwnProperty(item) && headers[item] !== null) {
      xhr.setRequestHeader(item, headers[item]);
    }
  }
  // 发送请求
  xhr.send(formData);
  return xhr;
}
