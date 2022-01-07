// VUE3 Element plus 定制版，使用原生 Element 样式

/* eslint-disable no-underscore-dangle */
// 监听 ajax请求，自动为匹配到的 dom 元素添加点击约束
import { createApp } from 'vue'
import { ElLoading } from 'element-plus'

/**
 *  使用例子
 * @param {string} element-loading-text           加载文案
 * @param {string} element-loading-spinner        自定义加载图标
 * @param {string} element-loading-background     遮罩背景色
 * @param {string} element-loading-custom-class   自定义类名
 * @example <div v-waiting="['get::/test/users?pageIndex=2', 'get::/test/users?pageIndex=1']" @click="test">点击</div>
 * @example <div v-waiting="'get::http://www.baidu.com/mock/50/test/users?pageIndex=2'" @click="test1">点击</div>
 * @example
 <div
  v-waiting="'get::http://www.baidu.com/mock/50/test/users?pageIndex=2'"
  element-loading-text="Loading..."
  element-loading-spinner="svg"
  element-loading-background="rgba(0, 0, 0, 0.8)"
  element-loading-custom-class="custom-class"
 >点击</div>
 */
// 样式是参考 element 的Loading 组件 https://element.eleme.cn/#/zh-CN/component/loading，做一些二次开发修改
export default {
  install(app) {
    app.directive('waiting', {
      beforeMount: (targetDom, binding) => {
      // 注入全局方法
        (function() {
          // 如果已经重置过，则不再进入。解决开发时局部刷新导致重新加载问题
          if (window.hadResetAjaxForWaiting) {
            return
          }
          window.hadResetAjaxForWaiting = true
          window.waitingAjaxMap = {} // 接口映射 {'get::http://www.baidu.com/mock/50/test/users?pageIndex=1': dom}

          // 保存一份原生的 XMLHttpRequest 对象 和 open 方法
          let OriginXHR = window.XMLHttpRequest
          let originOpen = OriginXHR.prototype.open

          // 重置 XMLHttpRequest
          window.XMLHttpRequest = function() {
            let targetDomList = [] // 存储 ajax 请求，影响到的 dom 元素
            let realXHR = new OriginXHR() // 实例化出一份新的 XMLHttpRequest对象，来进行重载

            realXHR.open = function(method, url, async) {
              Object.keys(window.waitingAjaxMap).forEach(key => {
                let [targetMethod, type, targetUrl] = key.split('::')
                if (!targetUrl) {
                  targetUrl = type
                }
                if (targetMethod.toLocaleLowerCase() === method.toLocaleLowerCase() && (url.indexOf(targetUrl) > -1 || new RegExp(targetUrl).test(url))) {
                  targetDomList = [...window.waitingAjaxMap[key], ...targetDomList]
                  window.waitingAjaxMap[key].forEach(dom => {
                    if (dom && dom.type === 'button') { // 如果当前是一个按钮，则使用自带loading效果
                      dom.__vnode.ref.i.props.loading = true
                    } else { // 否则使用 element 的 loading 组件
                      dom.ElLoading = ElLoading.service({
                        target: dom,
                        text: dom.getAttribute('element-loading-text'),
                        spinner: dom.getAttribute('element-loading-spinner'),
                        background: dom.getAttribute('element-loading-background'),
                        customClass: dom.getAttribute('element-loading-custom-class'),
                      })
                    }
                    dom.waitingAjaxNum = dom.waitingAjaxNum || 0 // 不使用 dataset，是应为 dataset 并不实时，在同一个时间内，上一次存储的值不能被保存
                    dom.waitingAjaxNum++
                  })
                }
              })
              // 使用原生的 XMLHttpRequest open操作
              originOpen.call(realXHR, method, url, async)
            }

            // 监听加载完成，清除 waiting
            realXHR.addEventListener('loadend', () => {
              targetDomList.forEach(dom => {
                dom.waitingAjaxNum--
                if (dom.waitingAjaxNum !== 0) return
                if (dom && dom.type === 'button') {
                  dom.__vnode.ref.i.props.loading = false
                } else {
                  dom.ElLoading.close()
                }
              })
            }, false)
            return realXHR
          }
        })()

        // 添加需要监听的接口，注入对应的 dom
        const targetUrlList = Array.isArray(binding.value) ? binding.value : [binding.value]
        targetUrlList.forEach(targetUrl => {
          window.waitingAjaxMap[targetUrl] = [targetDom, ...(window.waitingAjaxMap[targetUrl] || [])]
        })
      },

      // 参数变化
      update: (targetDom, binding) => {
        if (binding.oldValue !== binding.value) {
          const preTargetUrlList = Array.isArray(binding.oldValue) ? binding.oldValue : [binding.oldValue]
          preTargetUrlList.forEach(targetUrl => {
            const index = (window.waitingAjaxMap[targetUrl] || []).indexOf(targetDom)
            index > -1 && window.waitingAjaxMap[targetUrl].splice(index, 1)
          })

          // 添加需要监听的接口，注入对应的 dom
          const targetUrlList = Array.isArray(binding.value) ? binding.value : [binding.value]
          targetUrlList.forEach(targetUrl => {
            window.waitingAjaxMap[targetUrl] = [targetDom, ...(window.waitingAjaxMap[targetUrl] || [])]
          })
        }
      },

      // 指令被卸载，消除消息监听
      unmounted: (targetDom, binding) => {
        const targetUrlList = typeof binding.value === 'object' ? binding.value : [binding.value]
        targetUrlList.forEach(targetUrl => {
          const index = window.waitingAjaxMap[targetUrl].indexOf(targetDom)
          index > -1 && window.waitingAjaxMap[targetUrl].splice(index, 1)
          if (window.waitingAjaxMap[targetUrl].length === 0) {
            delete window.waitingAjaxMap[targetUrl]
          }
        })
      }
    })
  }
}
