---
# 当前页面内容标题
title: 常见概念
# 当前页面图标
icon: write
# 分类
category:
  - Docker
# 标签
tag:
  - Docker
sticky: false
# 是否收藏在博客主题的文章列表中，当填入数字时，数字越大，排名越靠前。
star: false
# 是否将该文章添加至文章列表中
article: true
# 是否将该文章添加至时间线中
timeline: true
---

# docker

## 6. Docker

官网：https://www.docker.com/

### 6.1 Docker简介

**Docker**是一种开源的容器化平台，可以帮助开发人员打包、发布和运行应用程序。

Docker的核心组件包括**Docker Engine、Docker Hub和Docker CLI**。其中，Docker Engine是Docker的核心引擎，用于构建、运行和管理Docker容器；Docker Hub是Docker的**公共镜像库**，可以存储和分享Docker**容器**镜像；Docker CLI是Docker的命令行界面，可以帮助开发人员管理Docker容器。

#### 6.1.1 Docker的跨系统性

Docker 能够在不同的操作系统之间适配的原因是因为它利用了操作系统提供的虚拟化技术。具体来说，Docker 使用了 Linux 内核提供的 **cgroups** 和 **namespace** 等功能来实现容器化，这些功能可以隔离应用程序和宿主操作系统之间的资源和环境。

在 Windows 和 macOS 上， Docker 利用了它们自己的虚拟化技术，分别是 **Hyper-V** 和 **xhyve**。这些技术可以在 Windows 和 macOS 上创建虚拟机，然后在虚拟机中运行 Linux 系统和 Docker 引擎，从而实现 Docker 在不同操作系统之间的适配。
也就是说Windows和Mac上使用Docker要么用系统自带的**WSL**虚拟话Linux系统，要么下载虚拟机（VMware）来构建Linux环境。总之都是基于Linux系统。

#### 6.1.2 WSL技术

**WSL (Windows Subsystem for Linux)** 是一种由 Microsoft 开发的技术，它允许在 Windows 操作系统上运行 Linux 应用程序和命令行工具。WSL 提供了一个运行 Linux 内核的轻量级虚拟化环境，与 Windows 操作系统相互隔离，但可以与 Windows 文件系统进行交互。通过 WSL，用户可以在 Windows 上使用 Linux 应用程序和工具，从而无需在 Windows 和 Linux 之间切换操作系统。

WSL 有两个版本：WSL 1 和 WSL 2。WSL 1 使用的是一个轻量级的虚拟机，它可以在 Windows 和 Linux 之间共享文件系统和网络资源，但性能可能不如 WSL 2。WSL 2 使用的是完整的 Linux 内核，它可以提供更好的性能和兼容性，并且支持在 Linux 上运行 Docker 等容器技术。

WSL 可以通过在 Windows 上安装适当的 Linux 发行版来启用。目前，Microsoft 支持在 WSL 上安装 Ubuntu、Debian、Kali Linux、OpenSUSE 和 SLES 等常见的 Linux 发行版。

也就是在不使用VMware直接在Windows系统中布置Linux发行版子系统

#### 6.1.3 Linux系统上功能的实现过程

应用程序调用库函数 -> 库函数调用调用内核指令 - >内核指令操作计算机硬件

#### 6.1.4 打包内容

1. 应用程序代码：这包括应用程序的源代码、可执行文件、配置文件等。
2. 运行时环境：包括操作系统、语言运行时、库文件、依赖包等。这样，应用程序可以在容器中运行，而不受宿主操作系统和环境的影响。
3. 应用程序依赖：例如数据库、消息队列、缓存等。这些依赖项可以与应用程序一起部署，并在容器内部运行，避免了在宿主操作系统上安装和配置这些依赖项的麻烦。
4. 配置文件：Docker 会将应用程序的配置文件打包到容器中，以便在容器启动时加载和使用。这些配置文件包括应用程序的参数设置、环境变量、日志输出等。
5. 其他资源：Docker 还可以打包其他应用程序所需的资源，例如静态文件、图片、视频等。这些资源可以与应用程序一起部署，并在容器内部使用。

#### 6.1.5 Docker打包是否增加了项目体积

对于一般部署，确实增加了体积，但可以接受。

首先，Docker 可以将应用程序和依赖项打包到一个容器中，并在容器中运行。这样可以避免在宿主操作系统上安装和配置各种依赖项，减少了部署和管理的复杂性和难度。虽然容器的体积相对较大，但是它可以减少应用程序的部署和运行的时间，提高了效率和可靠性。

其次，Docker 提供了一致的开发环境和部署方案，使得应用程序在不同的环境中保持一致的行为和性能。这种可移植性和可重复性可以减少部署和管理的风险，同时也方便了应用程序的迁移和扩展。

最后，Docker 还可以使用镜像缓存和增量构建等技术来优化容器的体积和构建时间。镜像缓存可以避免重复下载和构建镜像，从而加快部署和构建的速度。增量构建可以利用先前构建的镜像进行增量更新，从而减少构建时间和镜像体积。

#### 6.1.6 沙箱机制

**沙箱（Sandbox）**是一种安全机制，它可以将应用程序限制在一个封闭的环境中，从而防止应用程序访问系统资源或执行危险操作。

在计算机领域中，沙箱可以用于多种用途，例如：

1. 应用程序隔离
2. 恶意代码分析
3. 软件开发和测试
4. 虚拟化

#### 6.1.7 Docker与虚拟机的区别

1. 实现方式：Docker 利用 Linux 内核的命名空间和控制组技术，将应用程序和依赖项打包到一个容器中，并在容器中运行。而虚拟机通过虚拟化技术，在物理服务器上创建多个虚拟机，每个虚拟机都运行一个完整的操作系统和应用程序。
   Docker指涉及到项目用到的，虚拟机无论用与不用都将构建出完整操作系统。显得是分完备但又臃肿。

2. 资源占用：Docker 容器和虚拟机相比，更加轻量级，占用的资源更少。Docker 容器共享宿主操作系统的内核和其他资源，而虚拟机需要为每个虚拟机分配独立的操作系统和资源。

3. 启动时间：Docker 容器的启动时间比虚拟机更快，因为 Docker 只需要启动应用程序和依赖项，而不需要启动操作系统和其他环境。而虚拟机需要启动整个操作系统和虚拟化层，因此启动时间较长。

4. 管理和部署：Docker 容器的管理和部署更加方便和灵活。Docker 可以通过镜像来进行容器的构建和管理，镜像可以在不同的环境中共享和重复使用。而虚拟机需要进行独立的操作系统安装和配置，管理和部署较为复杂。

5. 安全性：虚拟机的安全性较高，因为每个虚拟机都运行独立的操作系统，相互之间隔离较好。而 Docker 容器共享宿主操作系统的内核和其他资源，容器之间隔离相对较弱，存在一定的安全风险。但是，Docker 通过沙箱和其他安全措施来加强容器的安全性，减少安全风险。

#### 6.1.8 Docker中的网络

Docker中的网络是一种虚拟网络，用于在多个Docker容器之间提供通信和连接的机制。在Docker中，可以创建多个网络，每个网络可以包含多个容器。容器可以通过网络进行通信，就好像它们位于同一主机上一样。

Docker提供了几种不同类型的网络，包括：

1. **桥接网络（Bridge network）**：这是Docker中默认的网络类型。它允许容器通过主机的网桥进行通信，并为每个容器分配唯一的IP地址。

2. **主机网络（Host network）**：这种类型的网络允许容器与主机共享网络命名空间，这意味着它们使用主机的网络栈。这可以提供更好的性能，但容器之间的隔离性会降低。

3. **覆盖网络（Overlay network）**：这种类型的网络允许在多个Docker主机之间创建虚拟网络，从而实现跨主机容器之间的通信。

4. **None网络**：这种类型的网络表示容器没有网络接口，因此它们与其他容器和主机之间没有网络连通性。


### 6.2 Docker安装

Docker 分为 CE 和 EE 两大版本。CE 即社区版（免费，支持周期 7 个月），EE 即企业版，强调安全，付费使用，支持周期 24 个月。Docker CE 分为 `stable` `test` 和 `nightly` 三个更新频道。

官方网站上有各种环境下的 [安装指南](https://docs.docker.com/install/)，这里主要介绍 Docker CE 在 CentOS上的安装。

#### 6.2.1 在CentOS安装Docker

Docker CE 支持 64 位版本 CentOS 7，并且要求内核版本不低于 3.10， CentOS 7 满足最低内核的要求，所以我们在CentOS 7安装Docker。（所以要求我们先在虚拟机中安装配置好CentOS7）

1. 卸载掉之前旧版本的Docker，可以使用下面命令卸载（没安装过就不用）

```yum
yum remove docker \
                  docker-client \
                  docker-client-latest \
                  docker-common \
                  docker-latest \
                  docker-latest-logrotate \
                  docker-logrotate \
                  docker-selinux \
                  docker-engine-selinux \
                  docker-engine \
                  docker-ce
```

2. 虚拟机联网，安装yum工具

```sh
yum install -y yum-utils \
           device-mapper-persistent-data \
           lvm2 --skip-broken
```

3. 然后更新本地镜像源：

```shell
# 设置docker镜像源
yum-config-manager \
    --add-repo \
    https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo
    
sed -i 's/download.docker.com/mirrors.aliyun.com\/docker-ce/g' /etc/yum.repos.d/docker-ce.repo

yum makecache fast
```

4. 安装Docker CE版

```shell
yum install -y docker-ce
```

5. 启动docker

Docker应用需要用到各种端口，逐一去修改防火墙设置。非常麻烦，因此建议**直接关闭防火墙**！

```sh
# 关闭
systemctl stop firewalld
# 禁止开机启动防火墙
systemctl disable firewalld
```

通过命令启动docker：

```sh
systemctl start docker  # 启动docker服务

systemctl stop docker  # 停止docker服务

systemctl restart docker  # 重启docker服务
```

然后输入命令，可以查看docker版本：

```
docker -v
```

设置docker开机自启动

1. 打开终端并使用以下命令编辑 Docker 服务文件：

```
sudo vi /lib/systemd/system/docker.service
```

2. 在 [Service] 部分添加以下两行：

```
ExecStartPost=/usr/sbin/iptables -P FORWARD ACCEPT Restart=always
```

这将确保 Docker 在启动时自动接受转发流量，并在失败时自动重启

3. 保存并关闭文件。:wq
4. 使用以下命令重新加载 systemd 系统：

```
sudo systemctl daemon-reload
```

5. 使用以下命令启用 Docker 开机自启动：

```
sudo systemctl enable docker.service
```

#### 6.2.2 配置镜像加速

docker官方镜像仓库网速较差，我们需要设置国内镜像服务：

参考阿里云的镜像加速文档：https://cr.console.aliyun.com/cn-hangzhou/instances/mirrors

#### 6.2.3 CentOS7安装DockerCompose

1. Linux下需要通过命令下载：

```sh
# 安装
curl -L https://github.com/docker/compose/releases/download/1.23.1/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose
```

如果在虚拟机下载速度较慢，或者下载失败，可以先下载到Windows本地再上传到`/usr/local/bin/`目录。

2. 修改文件权限

```sh
# 修改权限
chmod +x /usr/local/bin/docker-compose
```

3. Base自动补全命令：

```sh
# 补全命令
curl -L https://raw.githubusercontent.com/docker/compose/1.29.1/contrib/completion/bash/docker-compose > /etc/bash_completion.d/docker-compose
```

如果这里出现错误，需要修改自己的hosts文件：

```sh
echo "199.232.68.133 raw.githubusercontent.com" >> /etc/hosts
```

#### 6.2.4 Docker镜像仓库

搭建镜像仓库可以基于Docker官方提供的DockerRegistry来实现。官网地址：https://hub.docker.com/_/registry

##### 6.2.4.1 简化版镜像仓库

Docker官方的Docker Registry是一个基础版本的Docker镜像仓库，具备仓库管理的完整功能，但是没有图形化界面。命令如下：

```sh
docker run -d \
    --restart=always \
    --name registry	\
    -p 5000:5000 \
    -v registry-data:/var/lib/registry \
    registry
```

命令中挂载了一个数据卷registry-data到容器内的/var/lib/registry 目录，这是私有镜像库存放数据的目录。

访问http://YourIp:5000/v2/_catalog 可以查看当前私有镜像服务中包含的镜像

##### 6.2.4.2 带图形化界面

使用DockerCompose部署带有图象界面的DockerRegistry，命令如下：

```yaml
version: '3.0'
services:
  registry:
    image: registry
    volumes:
      - ./registry-data:/var/lib/registry
  ui:
    image: joxit/docker-registry-ui:static
    ports:
      - 8080:80
    environment:
      - REGISTRY_TITLE=昭晞私有仓库
      - REGISTRY_URL=http://registry:5000
    depends_on:
      - registry
```

##### 6.2.4.3 配置Docker信任地址

私服采用的是http协议，默认不被Docker信任，所以需要做一个配置：

```sh
# 打开要修改的文件
vi /etc/docker/daemon.json
# 添加地址：
"insecure-registries":["http://192.168.150.101:8080"]
# 重加载
systemctl daemon-reload
# 重启docker
systemctl restart docker
```

### 6.3 常见命令

#### 6.3.1 常见镜像命令

以下是一些常见的 Docker 镜像命令：

| 命令                                                 | 解释                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------ |
| docker images                                        | 列出本地主机上的所有 Docker 镜像                             |
| docker search <镜像名称>                             | 在 Docker Hub 上搜索指定名称的镜像                           |
| docker pull <镜像名称>                               | 下载指定名称的 Docker 镜像到本地主机                         |
| docker rmi <镜像名称>                                | 删除本地主机上指定名称的 Docker 镜像                         |
| docker tag <源镜像名称>:<标签> <目标镜像名称>:<标签> | 给本地主机上的 Docker 镜像打标签，以便在推送到 Docker Hub 或其他镜像仓库时使用 |
| docker build -t <镜像名称> <Dockerfile 路径>         | 使用 Dockerfile 构建新的 Docker 镜像，并指定镜像名称         |
| docker push <镜像名称>                               | 将本地主机上的 Docker 镜像推送到 Docker Hub 或其他镜像仓库   |
| docker save <镜像名称> -o <保存文件路径>             | 将本地主机上的 Docker 镜像保存到指定路径的文件中，以便在其他计算机上导入镜像 |
| docker load -i <镜像文件路径>                        | 从指定路径的文件中导入 Docker 镜像到本地主机                 |

#### 6.3.2 常见容器指令

以下是Docker中常用的容器指令：

| 命令                                             | 解释                                               |
| ------------------------------------------------ | -------------------------------------------------- |
| `docker run`                                     | 创建并启动一个容器                                 |
| docker ps                                        | 列出当前正在运行的容器                             |
| docker ps -a                                     | 查看所有的Docker容器，包括正在运行和已经停止的容器 |
| docker ps -a --filter "name=<容器名称或部分名称> | 过滤显示特定的Docker容器                           |
| docker stop                                      | 停止一个正在运行的容器                             |
| docker start                                     | 启动一个停止的容器                                 |
| docker restart                                   | 重启一个容器                                       |
| docker rm                                        | 删除一个容器                                       |
| docker exec                                      | 在运行的容器中执行命令                             |
| docker logs                                      | 查看容器的日志输出                                 |
| docker inspect                                   | 查看容器的详细信息                                 |
| docker build                                     | 根据 Dockerfile 构建镜像                           |
| docker push                                      | 将本地的镜像上传到 Docker Hub 等镜像仓库           |
| docker pull                                      | 从镜像仓库拉取镜像到本地                           |
| docker commit                                    | 将一个容器的修改保存为一个新的镜像                 |
| docker save                                      | 将镜像保存为 tar 文件                              |
| docker load                                      | 从 tar 文件中加载镜像                              |

#### 6.3.3 拉取镜像错误

这个错误通常表示当前用户没有访问 Docker 守护进程的权限。为了解决这个问题，您可以尝试以下方法：

1. 确保您在执行 Docker 命令时已经使用了 `sudo` 命令以管理员身份运行，例如：

  ```linux
  sudo docker pull nginx
  ```

2. 将当前用户添加到 `docker` 用户组中，以便允许该用户访问 Docker 守护进程。请按照以下步骤操作：

  a. 打开终端或 PowerShell 窗口。

  b. 输入以下命令并运行：

```Linux
sudo usermod -aG docker $USER
```

   `$USER` 表示当前登录的用户名。

  c. 退出当前终端或 PowerShell 窗口，并重新登录以使更改生效。

3. 确保 Docker 守护进程的套接字文件 `/var/run/docker.sock` 的权限正确。请按照以下步骤操作：

  a. 打开终端或 PowerShell 窗口。

  b. 输入以下命令并运行：

```Linux
sudo chmod 666 /var/run/docker.sock
```

  c. 如果问题仍然存在，请尝试重启 Docker 服务：

  a. 打开终端或 PowerShell 窗口。

  b. 输入以下命令并运行：

```Linux
sudo systemctl restart docker
```


如果您在执行上述步骤时仍然遇到问题，请确认您的操作系统和 Docker 版本是否兼容，并检查 Docker 安装和配置是否正确。

#### 6.3.4 常见网络命令

`<network_name>`是网络的名称，`<container_name>`是容器的名称或ID

| 命令                                                         | 解释                               |
| ------------------------------------------------------------ | ---------------------------------- |
| **docker network create <network_name>**                     | 创建一个新的Docker网络             |
| docker network ls                                            | 列出当前主机上的所有Docker网络     |
| **docker network inspect <network_name>**                    | 显示指定Docker网络的详细信息       |
| docker network connect <network_name> <container_name>       | 将指定的容器连接到指定的Docker网络 |
| **docker network disconnect <network_name> <container_name>** | 从指定的Docker网络中断开指定的容器 |
| docker network rm <network_name>                             | 删除指定的Docker网络               |
| **docker network prune**                                     | 删除未被使用的Docker网络           |

#### 6.3.5 常见Linux指令

1. ls：列出目录中的文件和子目录。

```
$ ls
file1.txt file2.txt file3.txt directory1 directory2
```

2. cd：进入指定目录。

```
$ cd directory1
```

3. pwd：显示当前工作目录的路径。

```
$ pwd
/home/user/directory1
```

4. mkdir：创建一个新的目录。

```
$ mkdir new_directory
```

5. rmdir：删除一个空目录。

```
$ rmdir empty_directory
```

6. touch：创建一个新文件或更新已有文件的时间戳。

```
$ touch file.txt
```

7. cat：连接文件并打印输出。

```
$ cat file.txt
This is the content of the file.
```

8. cp：复制文件或目录。

```
$ cp file.txt copy_of_file.txt
```

9. mv：移动文件或目录，或重命名文件或目录。

```
$ mv file.txt new_directory/file.txt
```

10. rm：删除文件或目录。

```
$ rm file.txt
```

11. chmod：更改文件或目录的权限。

```
$ chmod 755 script.sh
```

12. chown：更改文件或目录的所有者。

```
$ chown user:group file.txt
```

13. ps：显示当前正在运行的进程。

```
$ ps
  PID TTY          TIME CMD
  112 pts/0    00:00:00 bash
  154 pts/0    00:00:00 ps
```

14. top：显示系统中消耗资源最多的进程。

```
$ top
```

15. grep：在文件中搜索指定的模式。

```
$ grep "pattern" file.txt
```

16. tar：归档或解压缩文件或目录。

```
$ tar -cvf archive.tar file1 file2
$ tar -xvf archive.tar
```

17. ssh：建立安全的远程连接。

```
$ ssh user@remote_host
```

18. scp：在本地和远程主机之间传输文件。

```
$ scp file.txt user@remote_host:/remote/path
```

19. ping：测试主机之间的连接性和延迟时间。

```
$ ping google.com
```

20. ifconfig：显示网络接口的配置信息。

```
$ ifconfig
```

21. 执行更高权限指令（获得root权限）

```
$ sudo apt-get update
```

22. 切换至root

```
$ sudo su
```

23. 查找指定端口进程

```
$ sudo lsof -i :80
```

24. 杀死进程,根据进程pid杀死进程

```
$ kill 1234
```

#### 6.3.6 run命令

1. `docker run` 命令指定要使用的 Docker 镜像。

   ````
   $ docker run image_name
   ````

2.  `--name` 选项指定容器的名称。

    ````
    $ docker run --name my_container image_name
    ````

3.  `-p` 选项将容器内部的端口映射到主机的端口。左边宿主机端口，右边是容器端口

    ````
    $ docker run -p 80:80 image_name
    ````

4.  `-v` 选项将容器内部的路径映射到主机上的路径，以便在容器和主机之间共享数据，左边主机右边容器

    ````
    $ docker run -v /host/path:/container/path image_name
    ````

5.  `-e` 选项设置容器内的环境变量。在容器内设置一个名为 `MY_VAR` 的环境变量，并将其值设置为 `value`

    ````
    $ docker run -e MY_VAR=value image_name
    ````

6.  `--entrypoint` 选项指定容器启动时要运行的命令，容器启动时运行 `/bin/bash` 命令

    ````
    $ docker run --entrypoint /bin/bash image_name
    ````

7.  `--cpus` 和 `--memory` 选项限制容器可以使用的 CPU 和内存资源

    ````
    $ docker run --cpus=1 --memory=1g image_name
    ````

8. 配置容器开机自启动

   ```
   $ docker run --restart=always image_name
   ````

9. 设置已运行的容器开机自启动

   ```
   docker update --restart=always 容器名称或者ID例如750
   ```

### 6.4 数据卷

#### 6.4.1 数据卷简介

**数据卷（Volume）**是Docker中一种用于持久化存储容器数据的机制，它将主机上的目录或文件挂载到容器内部的指定目录，使得容器内部的数据可以被持久化到主机上的文件系统中，即使容器被删除或重新创建，数据仍然可以被保留。
数据卷是容器中虚拟的文件或目录，指向宿主中真实文件或目录。

使用数据卷的好处包括：

1. 数据持久化：通过数据卷，容器的数据可以在容器被删除或停止后仍然保留在主机上，从而避免数据丢失。

2. 数据共享：多个容器可以共享同一个数据卷，从而实现数据共享和通信。

3. 数据备份和恢复：通过备份数据卷，可以方便地进行数据备份和恢复。

在Docker中，可以使用`docker volume create`命令来创建一个数据卷，然后使用`docker run`命令时使用`-v`选项将数据卷挂载到容器内部的指定目录中，例如：

```
docker volume create mydata
docker run -v mydata:/data myimage上述命令会将名为`mydata`的数据卷挂载到容器内部的`/data`目录中。
```

除了使用命令行，也可以在`docker-compose.yml`文件中定义数据卷，例如：

```yml
version: '3'
services:
 myservice:
  image: myimage
  volumes:
    mydata:/data
```

上述`docker-compose.yml`文件中使用`volumes`关键字定义了名为`mydata`的数据卷，并在`myservice`服务中将其挂载到容器内部的`/data`目录中。

#### 6.4.2 数据卷指令

以下是Docker中常用的数据卷操作指令：

1. `docker volume create` – 创建一个数据卷
2. `docker volume inspect` – 查看数据卷的详细信息
3. `docker volume ls` – 列出所有数据卷
4. `docker volume prune` – 删除所有未被使用的数据卷
5. `docker run -v` – 在容器中挂载一个数据卷
6. `docker volume rm` – 删除一个指定的数据卷

```
docker run -v mydata:/data myimage
```

上述命令将名为 `mydata` 的数据卷挂载到容器内部的 `/data` 目录上

```
docker volume rm mydata
```

上述命令将名为 `mydata` 的数据卷删除。需要注意的是，在删除数据卷之前，需要先停止正在使用该数据卷的容器。

### 6.5 Dockerfile自定义镜像

官网文档： https://docs.docker.com/engine/reference/builder

#### 6.5.1镜像结构

Docker的镜像结构主要由多个镜像层（Image Layer）组成，每个镜像层都包含了一些文件系统的变化。镜像层采用了联合文件系统（UnionFS）的技术，即将多个文件系统层联合起来呈现为一个统一的文件系统，从而实现了镜像的分层存储。

 具体来说，每个镜像层都是只读的，并且是在上一个镜像层的基础上进行的修改。当创建新的镜像时，Docker会将这些镜像层堆叠在一起，形成一个新的镜像。由于镜像层是只读的，因此创建新的镜像不会改变原有的镜像层，从而实现了镜像的可重用性和高效性。

#### 6.5.2 Dockerfile语法

 Dockerfile是一个文本文件，用于**定义Docker**镜像的构建方式和配置信息（可以将一个SpringBoot工程定义为一个镜像）。Dockerfile中包含了一系列的指令和参数，用于描述镜像的构建过程、所需的环境和依赖关系等信息。

- 基本指令

1. FROM – 定义基础镜像，即当前镜像继承的父镜像。
  2. MAINTAINER – 定义镜像的维护者。
  3. RUN – 定义在镜像构建过程中需要执行的命令。
  4. CMD – 定义容器启动时需要执行的命令。
  5. EXPOSE – 定义容器暴露的端口。
  6. ENV – 定义环境变量。
  7. ADD/COPY – 将文件或目录从主机复制到镜像中。
  8. VOLUME – 定义容器的挂载点，用于持久化存储数据。
  9. WORKDIR – 定义容器中的工作目录。
  10. USER – 定义容器运行时的用户。
  11. ARG – 定义构建时的参数。
  12. ONBUILD – 定义一个镜像，该镜像会在其他镜像中作为基础镜像时触发执行。
  13. LABEL – 定义镜像的元数据，例如版本、描述等信息。

- DockerFile示例

下面是使用 Java 的 Dockerfile 示例，用于构建一个 Spring Boot 应用程序的镜像：

````dockerfile
# 指定基础镜像
FROM openjdk:11-jre-slim

# 设置工作目录
WORKDIR /app

# 复制应用程序代码
COPY target/myapp.jar .

# 暴露端口
EXPOSE 8080

# 在容器启动时运行应用程序
CMD ["java", "-jar", "myapp.jar"]
````

该 Dockerfile 的解释如下：

1. `FROM` 指令指定基础镜像 `openjdk:11-jre-slim`。

2. `WORKDIR` 指令设置工作目录为 `/app`。

3. `COPY` 指令将构建后的应用程序 `myapp.jar` 复制到镜像中。

4. `EXPOSE` 指令指定容器监听的端口 `8080`。

5. `CMD` 指令在容器启动时运行命令 `java -jar myapp.jar`，其中 `myapp.jar` 是应用程序的可执行 JAR 文件。

该 Dockerfile 用于构建一个 Spring Boot 应用程序的镜像，该应用程序在容器启动时会监听端口 `8080`。你可以使用以下命令构建该镜像：

```shell
$ docker build -t my_spring_boot_app .
```

其中 `-t` 参数指定镜像的名称为 `my_spring_boot_app`，`.` 表示 Dockerfile 文件所在目录。

然后，可以使用以下命令运行该镜像：

```shell
$ docker run -p 8080:8080 my_spring_boot_app
```

其中 `-p` 参数将容器的端口 `8080` 映射到主机的端口 `8080`，从而使应用程序可以通过主机的 IP 地址进行访问。

- DockerFile存放位置

通常情况下，Dockerfile 文件应该放在 Spring Boot 项目的**根目录**下。这样，当你在根目录下执行 `docker build` 命令时，Docker 会自动查找 Dockerfile 文件并使用它来构建镜像。

如果你的 Spring Boot 项目有多个模块，你可以在每个模块的根目录下分别创建 Dockerfile 文件，并在构建镜像时指定要使用的 Dockerfile 文件。例如，假设你有一个名为 `myapp` 的 Spring Boot 项目，其中包括一个名为 `web` 的模块和一个名为 `service` 的模块，那么你可以在 `myapp` 的根目录下创建一个名为 `Dockerfile` 的文件，并在 `web` 模块和 `service` 模块的根目录下分别创建名为 `Dockerfile.web` 和 `Dockerfile.service` 的文件。然后，你可以使用以下命令构建每个模块的镜像：

```shell
$ docker build -t myapp-web -f web/Dockerfile.web .
$ docker build -t myapp-service -f service/Dockerfile.service .
```

其中 `-t` 参数指定镜像的名称，`-f` 参数指定要使用的 Dockerfile 文件，`.` 表示 Dockerfile 文件所在目录。

### 6.6 DockerCompose文件

DockerCompose的详细语法参考官网：https://docs.docker.com/compose/compose-file/

#### 6.6.1 概念

Docker Compose 是一个用于定义和运行多个 Docker 容器的工具，它可以让你轻松地定义和管理多个容器应用程序的组件，以及它们之间的相互关系和依赖关系。

通常情况下，一个容器应用程序可能由多个容器组成，例如一个 Web 应用程序可能需要一个 Web 服务器容器、一个数据库容器和一个缓存容器。使用 Docker Compose，你可以使用 Docker Compose 文件来定义这些容器，以及它们之间的相互关系和依赖关系，然后使用 `docker-compose` 命令来启动、停止和管理这些容器。

Docker Compose 文件使用 YAML 格式编写，它包含了一些基本的元素，例如服务、容器、网络和卷。通过定义这些元素，你可以轻松地创建一个完整的容器应用程序。

#### 6.6.2 示例

以下是一个简单的 Docker Compose 文件示例，用于定义一个 Web 应用程序的容器组成部分：

````yaml
version: '3'
services:
  web:
    build: .
    ports:
      - "8000:8000"
    depends_on:
      - db
  db:
    image: postgres
    environment:
      POSTGRES_PASSWORD: mypassword
````

该 Docker Compose 文件中包含两个服务 `web` 和 `db`，分别对应 Web 服务器容器和数据库容器。`web` 服务使用 Dockerfile 构建镜像，并将容器端口 `8000` 映射到主机端口 `8000`，同时指定了 `db` 服务为它的依赖项。`db` 服务使用 Postgres 镜像，并设置了 `POSTGRES_PASSWORD` 环境变量。

使用以下命令可以启动该容器应用程序：

```shell
$ docker-compose up
```

该命令会启动 `web` 和 `db` 服务，并创建对应的容器。你可以使用以下命令来停止容器应用程序：

```shell
$ docker-compose down
```

使用 Docker Compose 可以轻松地定义和管理多个容器应用程序的组件和依赖关系，从而简化了容器化应用程序的开发和部署过程。