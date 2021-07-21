/** 核心代码，监听 ajax，自动为匹配到的 dom 元素添加点击约束  **/
// eslint-disable-next-line
// <div id="1" v-waiting="['get::waiting::/test/users?pageIndex=2', 'get::/test/users?pageIndex=1']" @click="test"></div>
// <div id="2" v-waiting="'get::loading::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=2'" @click="test">copy</div>
// <div id="3" v-waiting="'get::disable::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=2'" @click="test">copy</div>
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
      let originOpen = OriginXHR.prototype.open

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
    const targetUrlList = Array.isArray(binding.value) ? binding.value : [binding.value]
    targetUrlList.forEach(targetUrl => {
      window.waittingAjaxMap[targetUrl] = [targetDom, ...(window.waittingAjaxMap[targetUrl] || [])]
    })
  },

  // 参数变化
  update: (targetDom, binding) => {
    if (binding.oldValue !== binding.value) {
      const preTargetUrlList = Array.isArray(binding.oldValue) ? binding.oldValue : [binding.oldValue]
      preTargetUrlList.forEach(targetUrl => {
        const index = (window.waittingAjaxMap[targetUrl] || []).indexOf(targetDom)
        index > -1 && window.waittingAjaxMap[targetUrl].splice(index, 1)
      })

      // 添加需要监听的接口，注入对应的 dom
      const targetUrlList = Array.isArray(binding.value) ? binding.value : [binding.value]
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
