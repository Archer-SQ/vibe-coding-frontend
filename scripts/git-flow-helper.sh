#!/bin/bash

# Git Flow 辅助脚本
# 提供快速的 Git Flow 操作命令

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 显示帮助信息
show_help() {
    echo "Git Flow 辅助脚本"
    echo ""
    echo "用法: $0 [命令] [参数]"
    echo ""
    echo "命令:"
    echo "  feature start <name>    开始新功能开发"
    echo "  feature finish <name>   完成功能开发"
    echo "  feature list            列出所有功能分支"
    echo ""
    echo "  release start <version> 开始新版本发布"
    echo "  release finish <version> 完成版本发布"
    echo "  release list            列出所有发布分支"
    echo ""
    echo "  hotfix start <name>     开始热修复"
    echo "  hotfix finish <name>    完成热修复"
    echo "  hotfix list             列出所有热修复分支"
    echo ""
    echo "  status                  显示当前分支状态"
    echo "  sync                    同步远程分支"
    echo "  clean                   清理已合并的分支"
    echo ""
    echo "示例:"
    echo "  $0 feature start gesture-optimization"
    echo "  $0 release start v1.0.0"
    echo "  $0 hotfix start camera-fix"
}

# 检查是否在 Git 仓库中
check_git_repo() {
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_message $RED "错误: 当前目录不是 Git 仓库"
        exit 1
    fi
}

# 检查是否安装了 git-flow
check_git_flow() {
    if ! command -v git-flow &> /dev/null; then
        print_message $RED "错误: git-flow 未安装"
        print_message $YELLOW "请运行: brew install git-flow"
        exit 1
    fi
}

# 同步远程分支
sync_branches() {
    print_message $BLUE "同步远程分支..."
    git fetch origin
    git checkout develop
    git pull origin develop
    git checkout main
    git pull origin main
    print_message $GREEN "分支同步完成"
}

# 清理已合并的分支
clean_branches() {
    print_message $BLUE "清理已合并的分支..."
    
    # 删除已合并到 main 的本地分支
    git branch --merged main | grep -v "main\|develop" | xargs -n 1 git branch -d 2>/dev/null || true
    
    # 删除已合并到 develop 的本地分支
    git branch --merged develop | grep -v "main\|develop" | xargs -n 1 git branch -d 2>/dev/null || true
    
    print_message $GREEN "分支清理完成"
}

# 显示分支状态
show_status() {
    print_message $BLUE "当前分支状态:"
    echo ""
    
    print_message $YELLOW "当前分支:"
    git branch --show-current
    echo ""
    
    print_message $YELLOW "所有分支:"
    git branch -a
    echo ""
    
    print_message $YELLOW "功能分支:"
    git flow feature list 2>/dev/null || echo "无"
    echo ""
    
    print_message $YELLOW "发布分支:"
    git flow release list 2>/dev/null || echo "无"
    echo ""
    
    print_message $YELLOW "热修复分支:"
    git flow hotfix list 2>/dev/null || echo "无"
}

# 主函数
main() {
    check_git_repo
    check_git_flow
    
    case "$1" in
        "feature")
            case "$2" in
                "start")
                    if [ -z "$3" ]; then
                        print_message $RED "错误: 请提供功能名称"
                        exit 1
                    fi
                    print_message $BLUE "开始功能开发: $3"
                    git flow feature start "$3"
                    ;;
                "finish")
                    if [ -z "$3" ]; then
                        print_message $RED "错误: 请提供功能名称"
                        exit 1
                    fi
                    print_message $BLUE "完成功能开发: $3"
                    git flow feature finish "$3"
                    ;;
                "list")
                    print_message $BLUE "功能分支列表:"
                    git flow feature list
                    ;;
                *)
                    print_message $RED "错误: 未知的功能命令"
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        "release")
            case "$2" in
                "start")
                    if [ -z "$3" ]; then
                        print_message $RED "错误: 请提供版本号"
                        exit 1
                    fi
                    print_message $BLUE "开始版本发布: $3"
                    git flow release start "$3"
                    ;;
                "finish")
                    if [ -z "$3" ]; then
                        print_message $RED "错误: 请提供版本号"
                        exit 1
                    fi
                    print_message $BLUE "完成版本发布: $3"
                    git flow release finish "$3"
                    ;;
                "list")
                    print_message $BLUE "发布分支列表:"
                    git flow release list
                    ;;
                *)
                    print_message $RED "错误: 未知的发布命令"
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        "hotfix")
            case "$2" in
                "start")
                    if [ -z "$3" ]; then
                        print_message $RED "错误: 请提供热修复名称"
                        exit 1
                    fi
                    print_message $BLUE "开始热修复: $3"
                    git flow hotfix start "$3"
                    ;;
                "finish")
                    if [ -z "$3" ]; then
                        print_message $RED "错误: 请提供热修复名称"
                        exit 1
                    fi
                    print_message $BLUE "完成热修复: $3"
                    git flow hotfix finish "$3"
                    ;;
                "list")
                    print_message $BLUE "热修复分支列表:"
                    git flow hotfix list
                    ;;
                *)
                    print_message $RED "错误: 未知的热修复命令"
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        "status")
            show_status
            ;;
        "sync")
            sync_branches
            ;;
        "clean")
            clean_branches
            ;;
        "help"|"-h"|"--help"|"")
            show_help
            ;;
        *)
            print_message $RED "错误: 未知命令 '$1'"
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"