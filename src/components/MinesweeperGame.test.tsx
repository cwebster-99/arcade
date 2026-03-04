import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import MinesweeperGame from './MinesweeperGame'

describe('MinesweeperGame', () => {
  it('renders without crashing', () => {
    render(<MinesweeperGame />)
    expect(screen.getByRole('application', { name: /minesweeper game/i })).toBeInTheDocument()
  })

  it('shows the mine counter', () => {
    render(<MinesweeperGame />)
    expect(screen.getByLabelText(/mines remaining/i)).toBeInTheDocument()
  })

  it('shows a reset button', () => {
    render(<MinesweeperGame />)
    expect(screen.getByRole('button', { name: /reset game/i })).toBeInTheDocument()
  })

  it('renders the correct number of grid cells for beginner difficulty', () => {
    render(<MinesweeperGame />)
    // Beginner = 9 rows × 9 cols = 81 cells
    const cells = screen.getAllByRole('gridcell')
    expect(cells).toHaveLength(81)
  })

  it('places a flag on right-click of a hidden cell', () => {
    render(<MinesweeperGame />)
    const cells = screen.getAllByRole('gridcell')

    // Left-click a cell to start the game (mines are placed around first click)
    fireEvent.click(cells[40])

    // Find a cell that is still hidden
    const allCells = screen.getAllByRole('gridcell')
    const hiddenCell = allCells.find(cell =>
      cell.getAttribute('aria-label')?.includes('hidden')
    )

    expect(hiddenCell).toBeDefined()
    if (hiddenCell) {
      fireEvent.contextMenu(hiddenCell)
      expect(hiddenCell.textContent).toBe('🚩')
    }
  })

  it('switches difficulty when difficulty button is clicked', () => {
    render(<MinesweeperGame />)

    const intermediateBtn = screen.getByRole('button', { name: /intermediate/i })
    fireEvent.click(intermediateBtn)

    // Intermediate = 16×16 = 256 cells
    const cells = screen.getAllByRole('gridcell')
    expect(cells).toHaveLength(256)
  })

  it('shows initial smiley face on game start', () => {
    render(<MinesweeperGame />)
    const resetBtn = screen.getByRole('button', { name: /reset game/i })
    expect(resetBtn.textContent).toBe('😊')
  })
})
