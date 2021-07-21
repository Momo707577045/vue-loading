// 注入全局方法
(function() {
  if (window.hadResetAjaxForWaiting) { // 如果已经重置过，则不再进入。解决开发时局部刷新导致重新加载问题
    return
  }
  window.hadResetAjaxForWaiting = true
  window.waittingAjaxMap = {} // 接口映射 'get::http://yapi.luckly-mjw.cn/mock/50/test/users?pageIndex=1': dom

  let OriginXHR = window.XMLHttpRequest
  let originOpen = OriginXHR.prototype.open
  let isSameSpace = false // 是否在同一个宏任务中，避免频繁触发

  // 检测使用到的 dom 对象
  function checkDom() {
    if (!isSameSpace) { // 节流
      isSameSpace = true
      window.waittingAjaxMap = {} // 重置为空，重新寻找匹配的 dom
      const domList = document.querySelectorAll('[data-loading]')
      Array.prototype.forEach.call(domList, targetDom => {
        targetDom.dataset.loading.split(',').forEach(targetUrl => {
          targetUrl = targetUrl.replace(/['"[\]]/ig, '').trim()
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
        if (targetMethod.toLocaleLowerCase() === method.toLocaleLowerCase() && url.indexOf(targetUrl) > -1) {
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
    position: absolute !important;
    content: '' !important;
    left: 0 !important;
    top: 0 !important;
    width: 100% !important;
    height: 100% !important;
    opacity: 0.7 !important;
    z-index: 9999 !important;
    background-color: #ffffff !important;
  }
  .v-waiting-waiting::after {
    position: absolute !important;
    content: '数据加载中' !important;
    top: 50% !important;
    left: 0 !important;
    width: 100% !important;
    max-width: 100vw !important;
    color: #666666 !important;
    font-size: 20px !important;
    text-align: center !important;
    opacity: 1 !important;
    transform: translateY(-50%) !important;
    z-index: 9999 !important;
    animation: v-waiting-v-waiting-keyframes 1.8s infinite linear !important;
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
    position: absolute !important;
    content: '' !important;
    left: 50% !important;
    top: 50% !important;
    width: 30px !important;
    height: 30px !important;
    z-index: 9999 !important;
    opacity: 1 !important;
    cursor: not-allowed !important;
    animation: v-waiting-v-loading-keyframes 1.1s infinite linear !important;
    background-position: center !important;
    background-size: 30px 30px !important;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAAWlBMVEUAAABmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZJqDNWAAAAHXRSTlMAgOKKPykV1K5JDbIf9OzNvGHGpZ5lNi8Hl3RVbc989bAAAAE8SURBVEjH5ZRZcsMgEEQR2li0WbuXvv81k5ARTllAQZV/Un5fAnWbYdwj9iaKXM9Zgr7EDzxav9cw5LGGB4gq0iBArEFZtTb0lIEoQ3oNoN/MoyQ93wP62lb9rOnil9sqxO9y4YCW9mXfnxo2gVC0sannyxZoq9MN/PdsXPs56WtPm8dTT8lwYy5W6YiPadOdxbM/RL6x/4sqk+SNBupb0jxS0sLITNp5NJhlOJ4ZJSVmgiub/gLEENKTrPh7QvjaqgPQmcyPMLSBXFDYaup+fZwWRhXKNmDsppJ9InLu9JKgzwL/9jLPp2iu8Gf2jm+ml80rGbg7ducPygCi8MQOmfuEznuCfLkXGa40tTkf7E/mVKuzJtLT4nBw7piuS9/abXGUHQuHQaQapmiDTiyJWt8rFu8YWy4q9g6+AGYbJ4l/4YQUAAAAAElFTkSuQmCC) !important;

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
