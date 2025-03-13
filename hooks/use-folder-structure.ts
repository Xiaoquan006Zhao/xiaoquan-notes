"use client"

import { useState, useCallback, useEffect } from "react"
import { getFolderStructure, getFilesForFolder, type HtmlMetadata } from "@/lib/file-utils"

// Type for folder structure
export interface FolderNode {
  name: string
  path: string
  children: Record<string, FolderNode>
  files: string[]
  totalUniqueFiles: number
}

export function useFolderStructure(onFileSelect: (filename: string) => void) {
  const [folderStructure, setFolderStructure] = useState<FolderNode | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set([""]))
  const [currentFolderFiles, setCurrentFolderFiles] = useState<
    { file: string; metadata: HtmlMetadata; imageAttachments?: string[] }[]
  >([])
  const [loading, setLoading] = useState({
    structure: true,
    files: false,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    hasMore: false,
    total: 0,
    loading: false,
  })

  // Add search term state
  const [searchTerm, setSearchTerm] = useState("")

  // Load folder structure on initial render
  useEffect(() => {
    const loadFolderStructure = async () => {
      setLoading((prev) => ({ ...prev, structure: true }))
      try {
        // Get folder structure from server
        const structure = await getFolderStructure()
        setFolderStructure(structure)

        // If root has files, load them
        if (structure.files.length > 0) {
          setSelectedFolder("")
          loadFolderFiles("", 1, false, searchTerm)
        } else {
          // Otherwise, try to select the first folder
          const firstFolder = Object.values(structure.children)[0]
          if (firstFolder) {
            setSelectedFolder(firstFolder.path)
            setExpandedFolders(new Set([firstFolder.path]))
            loadFolderFiles(firstFolder.path, 1, false, searchTerm)
          }
        }
      } catch (error) {
        console.error("Error loading folder structure:", error)
      } finally {
        setLoading((prev) => ({ ...prev, structure: false }))
      }
    }

    loadFolderStructure()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load files for selected folder with pagination and search term
  const loadFolderFiles = useCallback(
    async (folderPath: string, page = 1, append = false, term = searchTerm) => {
      // Prevent loading if already loading files and not appending
      if (loading.files && !append) return

      setLoading((prev) => ({ ...prev, files: true }))
      setPagination((prev) => ({ ...prev, loading: true }))

      try {
        const result = await getFilesForFolder(folderPath, page, 20, term)

        // Handle empty results
        if (result.files.length === 0) {
          setPagination({
            page,
            hasMore: false,
            total: result.total,
            loading: false,
          })

          if (!append) {
            setCurrentFolderFiles([])
          }

          setLoading((prev) => ({ ...prev, files: false }))
          return
        }

        if (append) {
          // Append new files to the existing list while avoiding duplicates
          setCurrentFolderFiles((prev) => {
            const newFiles = [...prev]
            result.files.forEach((file) => {
              if (!newFiles.some((existing) => existing.file === file.file)) {
                newFiles.push(file)
              }
            })
            return newFiles
          })
          // Optionally select a file when appending if conditions are met
          const currentIndex = currentFolderFiles.findIndex((file) => file.file === result.files[0].file)
          if (currentIndex === -1 && result.files.length > 0) {
            const lastVisible = document.querySelector('.file-card[data-selected="true"]')
            if (lastVisible && lastVisible.getBoundingClientRect().bottom > window.innerHeight - 100) {
              onFileSelect(result.files[0].file)
            }
          }
        } else {
          // Replace the current list when not appending
          setCurrentFolderFiles(result.files)
          if (result.files.length > 0) {
            onFileSelect(result.files[0].file)
          }
        }

        setPagination({
          page,
          hasMore: result.hasMore,
          total: result.total,
          loading: false,
        })
      } catch (error) {
        console.error("Error loading folder files:", error)
        if (!append) {
          setCurrentFolderFiles([])
        }
        setPagination({
          page,
          hasMore: false,
          total: 0,
          loading: false,
        })
      } finally {
        setLoading((prev) => ({ ...prev, files: false }))
      }
    },
    [loading.files, onFileSelect, currentFolderFiles, searchTerm],
  )

  // Reset files and pagination when the search term changes
  useEffect(() => {
    // Reset pagination and files when search term changes
    setPagination({
      page: 1,
      hasMore: false,
      total: 0,
      loading: false,
    })
    setCurrentFolderFiles([])
    loadFolderFiles(selectedFolder, 1, false, searchTerm)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, selectedFolder])

  // Function to update search term from a UI element
  const onSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  // Load more files when scrolling
  const loadMoreFiles = useCallback(() => {
    if (pagination.hasMore && !pagination.loading) {
      setPagination((prev) => ({ ...prev, loading: true }))
      loadFolderFiles(selectedFolder, pagination.page + 1, true, searchTerm)
    }
  }, [pagination.hasMore, pagination.loading, pagination.page, selectedFolder, loadFolderFiles, searchTerm])

  // Handle folder selection
  const selectFolder = useCallback(
    (path: string) => {
      if (path === selectedFolder) return

      setSelectedFolder(path)
      setPagination({
        page: 1,
        hasMore: false,
        total: 0,
        loading: false,
      })
      setExpandedFolders((prev) => {
        const newSet = new Set(prev)
        newSet.add(path)
        return newSet
      })
      setCurrentFolderFiles([])
      loadFolderFiles(path, 1, false, searchTerm)
    },
    [selectedFolder, loadFolderFiles, searchTerm],
  )

  // Toggle folder expansion
  const toggleFolder = useCallback((path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }, [])

  return {
    folderStructure,
    selectedFolder,
    expandedFolders,
    currentFolderFiles,
    loading,
    pagination,
    loadFolderFiles,
    loadMoreFiles,
    selectFolder,
    toggleFolder,
    searchTerm,
    onSearchTermChange,
  }
}
