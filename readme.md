# 一劳永逸的点击约束解决方案

  ![](http://upyun.luckly-mjw.cn/Assets/click-constraint/001.jpeg)

### 研发背景，解决什么问题
- 点击约束：某个按钮触发一次点击后，待接口调用有结果都才能再次触发。避免用户多次点击，触发多次接口调用。
- 常规解决方案：为每个按钮，定义一个变量记录其点击状态，通过变量控制按钮的可点击状态。如 element 库中的`<el-button type="primary" :loading="true">加载中</el-button>`。通过 loading 变量控制。
- 常规方案存在的问题：
  - 变量冗余，需要为每个按钮定义一个变量记录其状态，使用成本和维护成本都比较高。
  - 兼容性不强，依赖 element 组件库，使用方法不通用。

     ![](http://upyun.luckly-mjw.cn/Assets/click-constraint/003.png)

- 本文章解决方案可解决以上问题，具有以下特点：
  - 使用成本低，代码粘贴复制即可，无需安装 npm 包，仅 180 行代码（包含 css 样式及 js）。
  - 兼容性强，不依赖第三方库，~~vue 技术盏项目均可接入。~~ 与技术盏无关，前端项目均可使用。
  - 实现原理简单，代码无加密，无混淆。根据业务需求可以进行定制化样式调整。
  - 除点击约束外，还可实现内容区的 loading 遮罩效果。
  - 支持正则匹配，实现数值匹配，精准匹配等功能

   ![](http://upyun.luckly-mjw.cn/Assets/click-constraint/004.jpeg)

### [VUE 自定义指令版 在线示例](http://blog.luckly-mjw.cn/tool-show/vue-loading/demo.html)
- 页面源码，通过控制台查看即可

### [架构无关，原生 JS版 在线示例](http://blog.luckly-mjw.cn/tool-show/vue-loading/demo-origin-js.html)
- 页面源码，通过控制台查看即可

### [VUE2 + Element UI 定制版](https://github.com/Momo707577045/vue-loading/blob/master/source-code-for-vue2-element.js)
- 使用 Element UI 默认样式，更加美观大方

### [VUE3 + Element Plus 定制版](https://github.com/Momo707577045/vue-loading/blob/master/source-code-for-vue3-element-plus.js)
- 使用 Element Plus 默认样式，更加美观大方

### 原生 JS 版，使用方式（仅需两步）
- 在所有 js 库之前引入[文件](https://blog.luckly-mjw.cn/tool-show/vue-loading/dom-loading.js)`https://blog.luckly-mjw.cn/tool-show/vue-loading/dom-loading.js`
  - 推荐下载到本地保存
  - 在所有 js 库之前引入是为了监听 XMLHttpRequest
- 在目标 dom 上，添加 data-loading 属性
  ```<div class="btn" data-loading="'get::loading::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=1'">发送单个请求 loading</div>```

  - data-loading 参数格式介绍
    - `data-loading="'get::loading::/mock/50/test/users'"`
    - 其中「get」表示监听的接口请求类型
    - 「loading」 标识点击约束时的 loading 样式。一种有三种，分别是「loading」「waiting」「disabled」。可以不填，默认为「waiting」。
    - 「/mock/50/test/users」标识需要监听的接口名，本质是通过`url.indexOf(targetUrl)`，indexOf 来进行字符串匹配。
    - 支持数字正则匹配，「/mock/\\\\d+/test/users」等价于「/mock/50/test/users」
  - 监听多个请求
    - `<div data-loading="['get::waiting::/test/users?pageIndex=2', 'get::/test/users?pageIndex=1']"></div>`
    - 通过数组形式，传入多个需要监听的请求。
    - loading 样式将在接口调用时显示，直到发起请求的所有接口请求均调用完成，才消除。
    - 未发起请求的接口，即使写在数组里面，也不会影响。
    - 数组的第二条数据，没有指定第二个参数的 loading 样式，该参数是可选的，默认样式为「waiting」
- ajax 路径正则匹配
  - 【数值匹配】「/mock/\\\\d+/test/users」，其中「\\\\d+」为匹配多个数值，「/mock/\\\\d+/test/users」可匹配「/mock/50/test/users」
  - 【精确匹配】通过在结尾添加「$」标识结束，如「/mock/50/test$」将忽略 「/mock/50/test/users」的匹配。只有「/mock/50/test」才会命中匹配

  ![](http://upyun.luckly-mjw.cn/Assets/click-constraint/007.jpeg)


### VUE 自定义指令版，使用方式（仅需两步）
- 注册全局自定义指令（代码量较少，且应对样式进行定制性调整。故不提供 npm 包，直接拷贝代码即可）
```
/** 核心代码，监听 ajax，自动为匹配到的 dom 元素添加点击约束  **/
// eslint-disable-next-line
// <div id="1" v-waiting="['get::waiting::/test/users?pageIndex=2', 'get::/test/users?pageIndex=1']" @click="test"></div>
// <div id="2" v-waiting="'get::loading::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=2'" @click="test">copy</div>
// <div id="3" v-waiting="'get::disable::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=2'" @click="test">copy</div>
// <div v-waiting="userApi.postLogin" @click="test1">兼容传入 axios 请求函数</div>

// 兼容转换传入的函数，转化为 URL 字符串
function cmptFunStrToUrl(targetList) {
  targetList = Array.isArray(targetList) ? targetList : [targetList] // 兼容转化为数组
  return targetList.map(targetItem => {
    if (typeof targetItem === 'function') { // 如果传入的是函数
      const funStr = targetItem.toString() // 将函数转化为字符串，进行解析
      if (funStr === 'function () { [native code] }') {
        throw new Error(`点击约束，因 Function.prototype.toString 限制，this 被 bind 修改过的函数无法解析, 请显式输入 url 字符串。 ${targetItem.name}，详情可参考 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/toString`)
      }
      const [, method, apiURL] = (funStr.match(/\.(get|post|delete|put|patch)\(['"`]([^'"`]+)/) || [])
      if (!method || !apiURL) {
        throw new Error(`点击约束，传入的函数解析失败, ${targetItem.name}`)
      }
      return `${method}::${apiURL}`
    }
    return targetItem
  })
}

Vue.directive('waiting', {
  bind: (targetDom, binding) => {
    // 注入全局方法
    (function() {
      if (window.hadResetAjaxForWaiting) { // 如果已经重置过，则不再进入。解决开发时局部刷新导致重新加载问题
        return
      }
      window.hadResetAjaxForWaiting = true
      window.waittingAjaxMap = {} // 接口映射 'get::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=1': dom

      let OriginXHR = window.XMLHttpRequest
      let originOpen = OriginXHR.prototype?.open || OriginXHR.open

      // 重置 XMLHttpRequest
      window.XMLHttpRequest = function() {
        let targetDomList = [] // 存储本 ajax 请求，影响到的 dom 元素
        let realXHR = new OriginXHR() // 重置操作函数，获取请求数据

        realXHR.open = function(method, url, asyn) {
          Object.keys(window.waittingAjaxMap).forEach(key => {
            let [targetMethod, type, targetUrl] = key.split('::')
            if (!targetUrl) { // 设置默认类型
              targetUrl = type
              type = 'v-waiting-waiting'
            } else { // 指定类型
              type = `v-waiting-${type}`
            }
            if (
              targetMethod.toLocaleLowerCase() === method.toLocaleLowerCase()
              && (url.indexOf(targetUrl) > -1 || new RegExp(targetUrl).test(url))
            ) {
              targetDomList = [...window.waittingAjaxMap[key], ...targetDomList]
              window.waittingAjaxMap[key].forEach(dom => {
                if (!dom.classList.contains(type)) {
                  dom.classList.add('v-waiting', type)
                  if (window.getComputedStyle(dom).position === 'static') { // 如果是 static 定位，则修改为 relative，为伪类的绝对定位做准备
                    dom.style.position = 'relative'
                  }
                }
                dom.waitingAjaxNum = dom.waitingAjaxNum || 0 // 不使用 dataset，是应为 dataset 并不实时，在同一个时间内，上一次存储的值不能被保存
                dom.waitingAjaxNum++
              })
            }
          })
          originOpen.call(realXHR, method, url, asyn)
        }

        // 监听加载完成，清除 waiting
        realXHR.addEventListener('loadend', () => {
          targetDomList.forEach(dom => {
            dom.waitingAjaxNum--
            dom.waitingAjaxNum === 0 && dom.classList.remove(
              'v-waiting',
              'v-waiting-loading',
              'v-waiting-waiting',
              'v-waiting-disable',
            )
          })
        }, false)
        return realXHR
      }
    })();

    // 注入全局 css
    (() => {
      if (!document.getElementById('v-waiting')) {
        let code = `
       .v-waiting {
    pointer-events: none;
    /*cursor: not-allowed; 与 pointer-events: none 互斥，设置 pointer-events: none 后，设置鼠标样式无效 */
  }
  .v-waiting::before {
    position: absolute;
    content: '';
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0.7;
    z-index: 9999;
    background-color: #ffffff;
  }
  .v-waiting-waiting::after {
    position: absolute;
    content: '数据加载中';
    top: 50%;
    left: 0;
    width: 100%;
    max-width: 100vw;
    color: #666666;
    font-size: 20px;
    text-align: center;
    transform: translateY(-50%);
    z-index: 9999;
    animation: v-waiting-v-waiting-keyframes 1.8s infinite linear;
  }
   @-webkit-keyframes v-waiting-v-waiting-keyframes {
    20% {
      content: '数据加载中.';
    }
    40% {
      content: '数据加载中..';
    }
    60% {
      content: '数据加载中...';
    }
    80% {
      content: '数据加载中...';
    }
  }
  .v-waiting-loading::after {
    position: absolute;
    content: '';
    left: 50%;
    top: 50%;
    width: 30px;
    height: 30px;
    z-index: 9999;
    cursor: not-allowed;
    animation: v-waiting-v-loading-keyframes 1.1s infinite linear;
    background-position: center;
    background-size: 30px 30px;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAWlBMVEUAAABmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZJqDNWAAAAHXRSTlMAgOKKPykV1K5JDbIf9OzNvGHGpZ5lNi8Hl3RVbc989bAAAAE8SURBVEjH5ZRZcsMgEEQR2li0WbuXvv81k5ARTllAQZV/Un5fAnWbYdwj9iaKXM9Zgr7EDzxav9cw5LGGB4gq0iBArEFZtTb0lIEoQ3oNoN/MoyQ93wP62lb9rOnil9sqxO9y4YCW9mXfnxo2gVC0sannyxZoq9MN/PdsXPs56WtPm8dTT8lwYy5W6YiPadOdxbM/RL6x/4sqk+SNBupb0jxS0sLITNp5NJhlOJ4ZJSVmgiub/gLEENKTrPh7QvjaqgPQmcyPMLSBXFDYaup+fZwWRhXKNmDsppJ9InLu9JKgzwL/9jLPp2iu8Gf2jm+ml80rGbg7ducPygCi8MQOmfuEznuCfLkXGa40tTkf7E/mVKuzJtLT4nBw7piuS9/abXGUHQuHQaQapmiDTiyJWt8rFu8YWy4q9g6+AGYbJ4l/4YQUAAAAAElFTkSuQmCC);
  }
  @-webkit-keyframes v-waiting-v-loading-keyframes {
    from {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }        `
        let style = document.createElement('style')
        style.id = 'v-waiting'
        style.type = 'text/css'
        style.rel = 'stylesheet'
        style.appendChild(document.createTextNode(code))
        let head = document.getElementsByTagName('head')[0]
        head.appendChild(style)
      }
    })()

    // 添加需要监听的接口，注入对应的 dom
    /*
      postLogin(body) {
        return api.post('/api/operation/user/login', body)
      }
      则传入 postLogin，会自动解析该函数的配置
      <div v-waiting="userApi.postLogin" @click="test1">兼容传入 axios 请求函数</div>
    */
    const targetUrlList = cmptFunStrToUrl(binding.value)
    targetUrlList.forEach(targetUrl => {
      window.waittingAjaxMap[targetUrl] = [targetDom, ...(window.waittingAjaxMap[targetUrl] || [])]
    })
  },

  // 参数变化
  update: (targetDom, binding) => {
    if (binding.oldValue !== binding.value) {
      const preTargetUrlList = cmptFunStrToUrl(binding.oldValue)
      preTargetUrlList.forEach(targetUrl => {
        const index = (window.waittingAjaxMap[targetUrl] || []).indexOf(targetDom)
        index > -1 && window.waittingAjaxMap[targetUrl].splice(index, 1)
      })

      // 添加需要监听的接口，注入对应的 dom
      const targetUrlList = cmptFunStrToUrl(binding.value)
      targetUrlList.forEach(targetUrl => {
        window.waittingAjaxMap[targetUrl] = [targetDom, ...(window.waittingAjaxMap[targetUrl] || [])]
      })
    }
  },

  // 指令被卸载，消除消息监听
  unbind: (targetDom, binding) => {
    const targetUrlList = typeof binding.value === 'object' ? binding.value : [binding.value]
    targetUrlList.forEach(targetUrl => {
      const index = window.waittingAjaxMap[targetUrl].indexOf(targetDom)
      index > -1 && window.waittingAjaxMap[targetUrl].splice(index, 1)
      if (window.waittingAjaxMap[targetUrl].length === 0) {
        delete window.waittingAjaxMap[targetUrl]
      }
    })
  }
})

```
- 在目标 dom 上，添加 v-waiting 属性
  ```<div class="btn" v-waiting="'get::loading::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=1'" @click="ajaxSingleTest">发送单个请求 loading</div>```

  - v-waiting 参数格式介绍
    - `v-waiting="'get::loading::/mock/50/test/users'"`
    - 其中「get」表示监听的接口请求类型
    - 「loading」 标识点击约束时的 loading 样式。一种有三种，分别是「loading」「waiting」「disabled」。可以不填，默认为「waiting」。
    - 「/mock/50/test/users」标识需要监听的接口名，本质是通过`url.indexOf(targetUrl)`，indexOf 来进行字符串匹配。
    - 支持数字正则匹配，「/mock/\\\\d+/test/users」等价于「/mock/50/test/users」
  - 监听多个请求
    - `<div v-waiting="['get::waiting::/test/users?pageIndex=2', 'get::/test/users?pageIndex=1']" @click="test"></div>`
    - 通过数组形式，传入多个需要监听的请求。
    - loading 样式将在接口调用时显示，直到发起请求的所有接口请求均调用完成，才消除。
    - 未发起请求的接口，即使写在数组里面，也不会影响。
    - 数组的第二条数据，没有指定第二个参数的 loading 样式，该参数是可选的，默认样式为「waiting」

- ajax 路径正则匹配
  - 【数值匹配】「/mock/\\\\d+/test/users」，其中「\\\\d+」为匹配多个数值，「/mock/\\\\d+/test/users」可匹配「/mock/50/test/users」
  - 【精确匹配】通过在结尾添加「$」标识结束，如「/mock/50/test$」将忽略 「/mock/50/test/users」的匹配。只有「/mock/50/test」才会命中匹配

  ![](http://upyun.luckly-mjw.cn/Assets/click-constraint/002.jpeg)

- 传入类似 axios 的请求配置函数
  - `<div class="btn" v-waiting="importAxiosFun" @click="ajaxFromImport">传递请求函数</div>`
  - 底层实现原理是，调用 Function.prototype.toString() 获取请求配置函数的源码，解析函数中的请求配置参数
  - 适合将接口请求配置独立抽离管理的项目，屏蔽具体的请求 URL 路径
  - 【特别注意】由于 [Function.prototype.toString](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/toString) 限制，this 被 bind 修改过的函数无法解析。例如，写在 vue methods 中定义的函数，toString 得到的只是 `function () { [native code] }`，无法获取函数源代码。但一般接口管理函数不会存在该问题。
  - 原生 JS 版暂不支持该功能
  ![](http://upyun.luckly-mjw.cn/Assets/click-constraint/008.png)

### 实现原理
- 重写 「XMLHttpRequest」，实现 ajax 的底层通用性监听，在接口发起时添加样式，返回结果后消除。
  - 屏蔽工具层的差异，无论使用的是 axios，还是 jquery-ajax，还是原生 XMLHttpRequest 均可实现监听。
  - 通过字符串匹配来监听不同的请求，```url.indexOf(targetUrl) > -1```。
  - 经实际应用经验，暂不考虑同名接口冲突情况。
  - 有需求的同学，可以提「issues」，作者会及时反馈。
- loading 内容的展示，通过伪类元素「::before」及「::after」来显示。
  - 其中「::before」实现遮罩层效果，
  - 使用「::after」元素的 content 来实现「加载中...」「旋转 loading icon」 的显示
  - 无需插入新的 dom 元素
  - 减少对 dom 布局的影响

 ![](http://upyun.luckly-mjw.cn/Assets/click-constraint/005.jpeg)

### 原生 JS版，源码如下
```
// 注入全局方法
(function() {
  if (window.hadResetAjaxForWaiting) { // 如果已经重置过，则不再进入。解决开发时局部刷新导致重新加载问题
    return
  }
  window.hadResetAjaxForWaiting = true
  window.waittingAjaxMap = {} // 接口映射 'get::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=1': dom

  let OriginXHR = window.XMLHttpRequest
  let originOpen = OriginXHR.prototype?.open || OriginXHR.open
  let isSameSpace = false // 是否在同一个宏任务中，避免频繁触发

  // 检测使用到的 dom 对象
  function checkDom() {
    if (!isSameSpace) { // 节流
      isSameSpace = true
      window.waittingAjaxMap = {} // 重置为空，重新寻找匹配的 dom
      const domList = document.querySelectorAll('[data-loading]')
      Array.prototype.forEach.call(domList, targetDom => {
        targetDom.dataset.loading.split(',').forEach(targetUrl => {
           targetUrl = targetUrl
              .replace(/['"[\]]/ig, '') // 去除冗余字符
              .replace(/\\\\/ig, '\\').trim() // 将双反斜杠转为单反斜杠，适配原生模式正则匹配
          window.waittingAjaxMap[targetUrl] = [targetDom, ...(window.waittingAjaxMap[targetUrl] || [])]
        })
      })
      setTimeout(() => isSameSpace = false) // 下一个宏任务中，重新开放该方法
    }
  }

  // 重置 XMLHttpRequest
  window.XMLHttpRequest = function() {
    let targetDomList = [] // 存储本 ajax 请求，影响到的 dom 元素
    let realXHR = new OriginXHR() // 重置操作函数，获取请求数据

    realXHR.open = function(method, url) {
      checkDom()
      Object.keys(window.waittingAjaxMap).forEach(key => {
        let [targetMethod, type, targetUrl] = key.split('::')
        if (!targetUrl) { // 设置默认类型
          targetUrl = type
          type = 'v-waiting-waiting'
        } else { // 指定类型
          type = `v-waiting-${type}`
        }
         if (
           targetMethod.toLocaleLowerCase() === method.toLocaleLowerCase()
           && (url.indexOf(targetUrl) > -1 || new RegExp(targetUrl).test(url))
         ) {
          targetDomList = [...window.waittingAjaxMap[key], ...targetDomList]
          window.waittingAjaxMap[key].forEach(dom => {
            if (!dom.classList.contains(type)) {
              dom.classList.add('v-waiting', type)
              if (window.getComputedStyle(dom).position === 'static') { // 如果是 static 定位，则修改为 relative，为伪类的绝对定位做准备
                dom.style.position = 'relative'
              }
            }
            dom.waitingAjaxNum = dom.waitingAjaxNum || 0 // 不使用 dataset，是应为 dataset 并不实时，在同一个时间内，上一次存储的值不能被保存
            dom.waitingAjaxNum++
          })
        }
      })
      console.log(url)
      originOpen.call(realXHR, method, url)
    }

    // 监听加载完成，清除 waiting
    realXHR.addEventListener('loadend', () => {
      targetDomList.forEach(dom => {
        dom.waitingAjaxNum--
        dom.waitingAjaxNum === 0 && dom.classList.remove(
          'v-waiting',
          'v-waiting-loading',
          'v-waiting-waiting',
          'v-waiting-disable',
        )
      })
    }, false)
    return realXHR
  }
})();

// 注入全局 css
(() => {
  if (!document.getElementById('v-waiting')) {
    let code = `
       .v-waiting {
    pointer-events: none;
    /*cursor: not-allowed; 与 pointer-events: none 互斥，设置 pointer-events: none 后，设置鼠标样式无效 */
  }
  .v-waiting::before {
    position: absolute;
    content: '';
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0.7;
    z-index: 9999;
    background-color: #ffffff;
  }
  .v-waiting-waiting::after {
    position: absolute;
    content: '数据加载中';
    top: 50%;
    left: 0;
    width: 100%;
    max-width: 100vw;
    color: #666666;
    font-size: 20px;
    text-align: center;
    transform: translateY(-50%);
    z-index: 9999;
    animation: v-waiting-v-waiting-keyframes 1.8s infinite linear;
  }
   @-webkit-keyframes v-waiting-v-waiting-keyframes {
    20% {
      content: '数据加载中.';
    }
    40% {
      content: '数据加载中..';
    }
    60% {
      content: '数据加载中...';
    }
    80% {
      content: '数据加载中...';
    }
  }
  .v-waiting-loading::after {
    position: absolute;
    content: '';
    left: 50%;
    top: 50%;
    width: 30px;
    height: 30px;
    z-index: 9999;
    cursor: not-allowed;
    animation: v-waiting-v-loading-keyframes 1.1s infinite linear;
    background-position: center;
    background-size: 30px 30px;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAWlBMVEUAAABmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZJqDNWAAAAHXRSTlMAgOKKPykV1K5JDbIf9OzNvGHGpZ5lNi8Hl3RVbc989bAAAAE8SURBVEjH5ZRZcsMgEEQR2li0WbuXvv81k5ARTllAQZV/Un5fAnWbYdwj9iaKXM9Zgr7EDzxav9cw5LGGB4gq0iBArEFZtTb0lIEoQ3oNoN/MoyQ93wP62lb9rOnil9sqxO9y4YCW9mXfnxo2gVC0sannyxZoq9MN/PdsXPs56WtPm8dTT8lwYy5W6YiPadOdxbM/RL6x/4sqk+SNBupb0jxS0sLITNp5NJhlOJ4ZJSVmgiub/gLEENKTrPh7QvjaqgPQmcyPMLSBXFDYaup+fZwWRhXKNmDsppJ9InLu9JKgzwL/9jLPp2iu8Gf2jm+ml80rGbg7ducPygCi8MQOmfuEznuCfLkXGa40tTkf7E/mVKuzJtLT4nBw7piuS9/abXGUHQuHQaQapmiDTiyJWt8rFu8YWy4q9g6+AGYbJ4l/4YQUAAAAAElFTkSuQmCC);
  }
  @-webkit-keyframes v-waiting-v-loading-keyframes {
    from {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }        `
    let style = document.createElement('style')
    style.id = 'v-waiting'
    style.type = 'text/css'
    style.rel = 'stylesheet'
    style.appendChild(document.createTextNode(code))
    let head = document.getElementsByTagName('head')[0]
    head.appendChild(style)
  }
})()
```


### VUE 自定义指令版，源码如下
```
/** 核心代码，监听 ajax，自动为匹配到的 dom 元素添加点击约束  **/
// eslint-disable-next-line
// <div id="1" v-waiting="['get::waiting::/test/users?pageIndex=2', 'get::/test/users?pageIndex=1']" @click="test"></div>
// <div id="2" v-waiting="'get::loading::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=2'" @click="test">copy</div>
// <div id="3" v-waiting="'get::disable::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=2'" @click="test">copy</div>
// <div v-waiting="userApi.postLogin" @click="test1">兼容传入 axios 请求函数</div>

// 兼容转换传入的函数，转化为 URL 字符串
function cmptFunStrToUrl(targetList) {
  targetList = Array.isArray(targetList) ? targetList : [targetList] // 兼容转化为数组
  return targetList.map(targetItem => {
    if (typeof targetItem === 'function') { // 如果传入的是函数
      const funStr = targetItem.toString() // 将函数转化为字符串，进行解析
      if (funStr === 'function () { [native code] }') {
        throw new Error(`点击约束，因 Function.prototype.toString 限制，this 被 bind 修改过的函数无法解析, 请显式输入 url 字符串。 ${targetItem.name}，详情可参考 https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Function/toString`)
      }
      const [, method, apiURL] = (funStr.match(/\.(get|post|delete|put|patch)\(['"`]([^'"`]+)/) || [])
      if (!method || !apiURL) {
        throw new Error(`点击约束，传入的函数解析失败, ${targetItem.name}`)
      }
      return `${method}::${apiURL}`
    }
    return targetItem
  })
}

Vue.directive('waiting', {
  bind: (targetDom, binding) => {
    // 注入全局方法
    (function() {
      if (window.hadResetAjaxForWaiting) { // 如果已经重置过，则不再进入。解决开发时局部刷新导致重新加载问题
        return
      }
      window.hadResetAjaxForWaiting = true
      window.waittingAjaxMap = {} // 接口映射 'get::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=1': dom

      let OriginXHR = window.XMLHttpRequest
      let originOpen = OriginXHR.prototype?.open || OriginXHR.open

      // 重置 XMLHttpRequest
      window.XMLHttpRequest = function() {
        let targetDomList = [] // 存储本 ajax 请求，影响到的 dom 元素
        let realXHR = new OriginXHR() // 重置操作函数，获取请求数据

        realXHR.open = function(method, url, asyn) {
          Object.keys(window.waittingAjaxMap).forEach(key => {
            let [targetMethod, type, targetUrl] = key.split('::')
            if (!targetUrl) { // 设置默认类型
              targetUrl = type
              type = 'v-waiting-waiting'
            } else { // 指定类型
              type = `v-waiting-${type}`
            }
            if (
              targetMethod.toLocaleLowerCase() === method.toLocaleLowerCase()
              && (url.indexOf(targetUrl) > -1 || new RegExp(targetUrl).test(url))
            ) {
              targetDomList = [...window.waittingAjaxMap[key], ...targetDomList]
              window.waittingAjaxMap[key].forEach(dom => {
                if (!dom.classList.contains(type)) {
                  dom.classList.add('v-waiting', type)
                  if (window.getComputedStyle(dom).position === 'static') { // 如果是 static 定位，则修改为 relative，为伪类的绝对定位做准备
                    dom.style.position = 'relative'
                  }
                }
                dom.waitingAjaxNum = dom.waitingAjaxNum || 0 // 不使用 dataset，是应为 dataset 并不实时，在同一个时间内，上一次存储的值不能被保存
                dom.waitingAjaxNum++
              })
            }
          })
          originOpen.call(realXHR, method, url, asyn)
        }

        // 监听加载完成，清除 waiting
        realXHR.addEventListener('loadend', () => {
          targetDomList.forEach(dom => {
            dom.waitingAjaxNum--
            dom.waitingAjaxNum === 0 && dom.classList.remove(
              'v-waiting',
              'v-waiting-loading',
              'v-waiting-waiting',
              'v-waiting-disable',
            )
          })
        }, false)
        return realXHR
      }
    })();

    // 注入全局 css
    (() => {
      if (!document.getElementById('v-waiting')) {
        let code = `
       .v-waiting {
    pointer-events: none;
    /*cursor: not-allowed; 与 pointer-events: none 互斥，设置 pointer-events: none 后，设置鼠标样式无效 */
  }
  .v-waiting::before {
    position: absolute;
    content: '';
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    opacity: 0.7;
    z-index: 9999;
    background-color: #ffffff;
  }
  .v-waiting-waiting::after {
    position: absolute;
    content: '数据加载中';
    top: 50%;
    left: 0;
    width: 100%;
    max-width: 100vw;
    color: #666666;
    font-size: 20px;
    text-align: center;
    transform: translateY(-50%);
    z-index: 9999;
    animation: v-waiting-v-waiting-keyframes 1.8s infinite linear;
  }
   @-webkit-keyframes v-waiting-v-waiting-keyframes {
    20% {
      content: '数据加载中.';
    }
    40% {
      content: '数据加载中..';
    }
    60% {
      content: '数据加载中...';
    }
    80% {
      content: '数据加载中...';
    }
  }
  .v-waiting-loading::after {
    position: absolute;
    content: '';
    left: 50%;
    top: 50%;
    width: 30px;
    height: 30px;
    z-index: 9999;
    cursor: not-allowed;
    animation: v-waiting-v-loading-keyframes 1.1s infinite linear;
    background-position: center;
    background-size: 30px 30px;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAWlBMVEUAAABmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZJqDNWAAAAHXRSTlMAgOKKPykV1K5JDbIf9OzNvGHGpZ5lNi8Hl3RVbc989bAAAAE8SURBVEjH5ZRZcsMgEEQR2li0WbuXvv81k5ARTllAQZV/Un5fAnWbYdwj9iaKXM9Zgr7EDzxav9cw5LGGB4gq0iBArEFZtTb0lIEoQ3oNoN/MoyQ93wP62lb9rOnil9sqxO9y4YCW9mXfnxo2gVC0sannyxZoq9MN/PdsXPs56WtPm8dTT8lwYy5W6YiPadOdxbM/RL6x/4sqk+SNBupb0jxS0sLITNp5NJhlOJ4ZJSVmgiub/gLEENKTrPh7QvjaqgPQmcyPMLSBXFDYaup+fZwWRhXKNmDsppJ9InLu9JKgzwL/9jLPp2iu8Gf2jm+ml80rGbg7ducPygCi8MQOmfuEznuCfLkXGa40tTkf7E/mVKuzJtLT4nBw7piuS9/abXGUHQuHQaQapmiDTiyJWt8rFu8YWy4q9g6+AGYbJ4l/4YQUAAAAAElFTkSuQmCC);
  }
  @-webkit-keyframes v-waiting-v-loading-keyframes {
    from {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    to {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }        `
        let style = document.createElement('style')
        style.id = 'v-waiting'
        style.type = 'text/css'
        style.rel = 'stylesheet'
        style.appendChild(document.createTextNode(code))
        let head = document.getElementsByTagName('head')[0]
        head.appendChild(style)
      }
    })()

    // 添加需要监听的接口，注入对应的 dom
    /*
      postLogin(body) {
        return api.post('/api/operation/user/login', body)
      }
      则传入 postLogin，会自动解析该函数的配置
      <div v-waiting="userApi.postLogin" @click="test1">兼容传入 axios 请求函数</div>
    */
    const targetUrlList = cmptFunStrToUrl(binding.value)
    targetUrlList.forEach(targetUrl => {
      window.waittingAjaxMap[targetUrl] = [targetDom, ...(window.waittingAjaxMap[targetUrl] || [])]
    })
  },

  // 参数变化
  update: (targetDom, binding) => {
    if (binding.oldValue !== binding.value) {
      const preTargetUrlList = cmptFunStrToUrl(binding.oldValue)
      preTargetUrlList.forEach(targetUrl => {
        const index = (window.waittingAjaxMap[targetUrl] || []).indexOf(targetDom)
        index > -1 && window.waittingAjaxMap[targetUrl].splice(index, 1)
      })

      // 添加需要监听的接口，注入对应的 dom
      const targetUrlList = cmptFunStrToUrl(binding.value)
      targetUrlList.forEach(targetUrl => {
        window.waittingAjaxMap[targetUrl] = [targetDom, ...(window.waittingAjaxMap[targetUrl] || [])]
      })
    }
  },

  // 指令被卸载，消除消息监听
  unbind: (targetDom, binding) => {
    const targetUrlList = typeof binding.value === 'object' ? binding.value : [binding.value]
    targetUrlList.forEach(targetUrl => {
      const index = window.waittingAjaxMap[targetUrl].indexOf(targetDom)
      index > -1 && window.waittingAjaxMap[targetUrl].splice(index, 1)
      if (window.waittingAjaxMap[targetUrl].length === 0) {
        delete window.waittingAjaxMap[targetUrl]
      }
    })
  }
})

```

### 注意事项
- 由于底层是通过伪类「::after」「::before」来填充元素的，故将会覆盖使用 v-waiting 自定义指令的 dom 元素原本的 「::after」「::before」
- 本文仅实现 「XMLHttpRequest」 的重载，未对「fetch」方法进行监听，有这方面需求的同学，欢迎提「issues」。

### 通用版本（与框架无关，vue，react，jquery 项目均可）
- 属性名改为`data-loading`
- react `data-loading={'get::disable::user/ownCompany'}`
- 普通 `data-loading='get::disable::user/ownCompany'`
- 使用方式，在 index.html 中提前加载 `dom-loading.js` 文件即可


### 完结撒花，感谢阅读。
![](http://upyun.luckly-mjw.cn/Assets/click-constraint/006.jpeg)



